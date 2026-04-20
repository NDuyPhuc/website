import express from "express";
import { PayOS } from "@payos/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

console.log('API Server starting with NODE_ENV:', process.env.NODE_ENV);

// Initialize Firebase Admin with better error handling
try {
  if (getApps().length === 0) {
    console.log('Initializing Firebase Admin...');
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (rawServiceAccount) {
      try {
        const serviceAccount = JSON.parse(rawServiceAccount);
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('Firebase Admin initialized with service account');
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        if (projectId) {
          initializeApp({ projectId });
          console.log('Firebase Admin initialized with projectId fallback');
        } else {
          throw parseError;
        }
      }
    } else if (projectId) {
      initializeApp({ projectId });
      console.log('Firebase Admin initialized with projectId');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID not set. Using application default credentials.');
      initializeApp();
    }

    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

const db = getFirestore();

// PayOS initialization
let payos: PayOS | null = null;
try {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (clientId && apiKey && checksumKey) {
    payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
    console.log('PayOS initialized');

    // Register webhook URL on startup (async, non-blocking)
    const webhookUrl = `${(process.env.APP_URL || "https://website-two-nu-66.vercel.app").replace(/\/$/, '')}/api/payos-webhook`;
    if (payos && process.env.VERCEL) {
      payos.webhooks.confirm(webhookUrl)
        .then(() => console.log(`PayOS webhook URL registered: ${webhookUrl}`))
        .catch((err) => console.warn(`Warning: Could not auto-register webhook URL. Please manually set it in PayOS Dashboard to: ${webhookUrl}`, err?.message));
    }
  } else {
    console.warn('PayOS is not configured. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY to enable payments.');
  }
} catch (error) {
  console.error('PayOS Initialization Error:', error);
}

const app = express();
const PORT = 3001; // Use a different port for API in local dev

app.use(bodyParser.json());

// Health check endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    appUrl: process.env.APP_URL,
    webhookUrl: `${(process.env.APP_URL || "https://website-two-nu-66.vercel.app").replace(/\/$/, '')}/api/payos-webhook`,
    payosConfigured: !!payos,
  });
});

// Check webhook URL registration status
app.get("/api/register-webhook", async (req, res) => {
  try {
    if (!payos) {
      return res.status(503).json({ error: "PayOS not configured" });
    }

    const webhookUrl = `${(process.env.APP_URL || "https://website-two-nu-66.vercel.app").replace(/\/$/, '')}/api/payos-webhook`;
    
    console.log(`\n=== WEBHOOK REGISTRATION ===`);
    console.log(`Attempting to register webhook URL: ${webhookUrl}`);

    try {
      const result = await payos.webhooks.confirm(webhookUrl);
      console.log('✅ Webhook registered successfully:', result);
      
      return res.json({
        success: true,
        message: "Webhook URL registered with PayOS",
        webhookUrl,
        result
      });
    } catch (confirmError: any) {
      console.warn('Warning: Webhook confirm returned error (may already be registered):', confirmError?.message);
      
      return res.json({
        success: true,
        message: "Webhook URL setup attempted",
        webhookUrl,
        note: "If webhook was already registered, this is normal",
        error: confirmError?.message
      });
    }
  } catch (error: any) {
    console.error("register-webhook error:", error);
    res.status(500).json({ 
      error: error?.message || "Failed to register webhook",
      webhookUrl: `${(process.env.APP_URL || "https://website-two-nu-66.vercel.app").replace(/\/$/, '')}/api/payos-webhook`
    });
  }
});
app.get("/api/order-status/:orderCode", async (req, res) => {
  try {
    const { orderCode } = req.params;
    const orderRef = db.collection("paymentOrders").doc(orderCode);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderSnap.data();
    res.json({
      success: true,
      order: {
        orderCode: orderData.orderCode,
        userId: orderData.userId,
        amount: orderData.amount,
        status: orderData.status,
        webhookVerified: orderData.webhookVerified,
        createdAt: orderData.createdAt,
        paidAt: orderData.paidAt || null
      }
    });
  } catch (error: any) {
    console.error("order-status error:", error);
    res.status(500).json({ error: error?.message || "Failed to get order status" });
  }
});

// 1. Create Top-up Order
app.post("/api/create-topup-order", async (req, res) => {
  try {
    if (!payos) {
      return res.status(503).json({ error: "Payment service is not configured" });
    }

    const { userId, amount, description } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderCode = Number(String(Date.now()).slice(-8));
    const orderRef = db.collection("paymentOrders").doc(String(orderCode));

    await orderRef.set({
      userId,
      orderCode,
      amount,
      credits: amount,
      status: "PENDING",
      description: description || "Titan Forge Wallet Top-up",
      provider: "payOS",
      createdAt: FieldValue.serverTimestamp(),
      webhookVerified: false,
    });

    const appBaseUrl = (process.env.APP_URL || "https://website-two-nu-66.vercel.app").replace(/\/$/, '');
    
    // Using /payment-result as suggested
    const returnUrl = process.env.PAYOS_RETURN_URL || `${appBaseUrl}/payment-result?status=success&orderCode=${orderCode}`;
    const cancelUrl = process.env.PAYOS_CANCEL_URL || `${appBaseUrl}/payment-result?status=cancelled&orderCode=${orderCode}`;

    const paymentLinkRes = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: `TOPUP ${orderCode}`,
      cancelUrl,
      returnUrl,
    });

    await orderRef.update({
      paymentLinkId: paymentLinkRes.paymentLinkId,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || "",
    });

    return res.json({
      success: true,
      orderCode,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode,
    });
  } catch (error: any) {
    console.error("create-topup-order error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create payment",
    });
  }
});

// 2. PayOS Webhook
app.post("/api/payos-webhook", async (req, res) => {
  try {
    console.log('Received webhook from PayOS:', JSON.stringify(req.body, null, 2));
    
    if (!payos) {
      return res.status(503).json({ error: "Payment service is not configured" });
    }

    const webhookData = req.body;
    console.log('Verifying webhook data...');
    const verifiedData = await payos.webhooks.verify(webhookData);
    console.log('Verified webhook data:', verifiedData);

    if (webhookData.code === "00" && webhookData.desc === "success") {
      const orderCode = verifiedData.orderCode;
      const amount = verifiedData.amount;

      const orderRef = db.collection("paymentOrders").doc(String(orderCode));
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const currentOrder = orderSnap.data()!;
      if (currentOrder.status === "PAID") {
        return res.json({ success: true });
      }

      const userId = currentOrder.userId;

      await db.runTransaction(async (transaction) => {
        const walletRef = db.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        const currentBalance = walletSnap.exists ? walletSnap.data()?.balance || 0 : 0;

        transaction.set(
          walletRef,
          {
            balance: currentBalance + amount,
            userId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(db.collection("walletTransactions").doc(), {
          userId,
          type: "TOPUP",
          amount,
          credits: amount,
          status: "COMPLETED",
          orderCode,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.update(orderRef, {
          status: "PAID",
          paidAt: FieldValue.serverTimestamp(),
          webhookVerified: true,
        });

        transaction.set(
          db.collection("users").doc(userId),
          {
            totalTopup: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("payos-webhook error:", error);
    return res.status(500).json({ error: "Webhook handling failed" });
  }
});

// Test endpoint - simulate PayOS webhook
app.post("/api/test-webhook-trigger", async (req, res) => {
  try {
    const { orderCode, amount } = req.body;
    
    if (!orderCode || !amount) {
      return res.status(400).json({ error: "Missing orderCode or amount" });
    }

    console.log(`\n=== TEST WEBHOOK TRIGGER ===`);
    console.log(`Testing webhook with orderCode: ${orderCode}, amount: ${amount}`);

    // Simulate PayOS webhook payload
    const mockWebhookData = {
      code: "00",
      desc: "success",
      success: true,
      data: {
        orderCode: Number(orderCode),
        amount: Number(amount),
        description: "TEST_TOPUP",
        accountNumber: "1234567890",
        reference: "TEST_REF_" + Date.now(),
        transactionDateTime: new Date().toISOString(),
        currency: "VND",
        paymentLinkId: "test-link-id-" + Date.now(),
        code: "00",
        desc: "Thành công"
      },
      signature: "test-signature-for-testing"
    };

    console.log('Mock webhook payload:', JSON.stringify(mockWebhookData, null, 2));

    // Now call the actual webhook handler
    // First check if order exists
    const orderRef = db.collection("paymentOrders").doc(String(orderCode));
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      return res.status(404).json({ 
        error: "Order not found",
        orderCode,
        checkedAt: new Date().toISOString()
      });
    }

    const currentOrder = orderSnap.data();
    console.log('Found order:', currentOrder);

    // Simulate webhook processing
    if (mockWebhookData.code === "00" && mockWebhookData.desc === "success") {
      const userId = currentOrder.userId;
      const txAmount = mockWebhookData.data.amount;

      console.log(`Processing payment for user: ${userId}, amount: ${txAmount}`);

      // Update wallet
      await db.runTransaction(async (transaction) => {
        const walletRef = db.collection("wallets").doc(userId);
        const walletSnap = await transaction.get(walletRef);
        const currentBalance = walletSnap.exists ? walletSnap.data()?.balance || 0 : 0;

        transaction.set(
          walletRef,
          {
            balance: currentBalance + txAmount,
            userId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(db.collection("walletTransactions").doc(), {
          userId,
          type: "TOPUP",
          amount: txAmount,
          credits: txAmount,
          status: "COMPLETED",
          orderCode: Number(orderCode),
          createdAt: FieldValue.serverTimestamp(),
          isTest: true
        });

        transaction.update(orderRef, {
          status: "PAID",
          paidAt: FieldValue.serverTimestamp(),
          webhookVerified: true,
          testProcessed: true
        });

        transaction.set(
          db.collection("users").doc(userId),
          {
            totalTopup: FieldValue.increment(txAmount),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      console.log(`✅ Test webhook processed successfully!`);
      return res.json({ 
        success: true, 
        message: "Test webhook processed successfully",
        orderCode,
        userId,
        amount: txAmount,
        timestamp: new Date().toISOString()
      });
    }

    res.status(400).json({ error: "Test webhook code was not 00/success" });
  } catch (error: any) {
    console.error("test-webhook-trigger error:", error);
    res.status(500).json({ error: error?.message || "Test webhook failed" });
  }
});

// Local development listener
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    app.listen(PORT, "127.0.0.1", () => {
      console.log(`API Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start API listener:', err);
  }
}

export default app;
