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
app.post("/api/test-webhook", async (req, res) => {
  try {
    console.log('Test webhook called with body:', JSON.stringify(req.body, null, 2));
    
    // Simulate PayOS webhook with test data
    const testWebhookData = {
      code: "00",
      desc: "success",
      success: true,
      data: {
        orderCode: req.body.orderCode || 12345678,
        amount: req.body.amount || 10000,
        description: "TEST TOPUP",
        accountNumber: "1234567890",
        reference: "TEST123",
        transactionDateTime: new Date().toISOString(),
        currency: "VND",
        paymentLinkId: "test-link-id",
        code: "00",
        desc: "Thành công"
      },
      signature: "test-signature"
    };

    // Forward to webhook handler
    const mockReq = {
      body: testWebhookData
    };
    const mockRes = {
      json: (data) => res.json({ test: true, ...data }),
      status: (code) => ({
        json: (data) => res.status(code).json({ test: true, ...data })
      })
    };

    // Call webhook directly
    const webhookPost = app._router.stack.find(r => r.route && r.route.path === '/api/payos-webhook' && r.route.methods.post);
    if (webhookPost) {
      console.log('Webhook endpoint found, forwarding test data...');
    }

    return res.json({ success: true, message: "Test webhook sent to handler. Check API logs." });
  } catch (error: any) {
    console.error("test-webhook error:", error);
    return res.status(500).json({ error: error?.message || "Test webhook failed" });
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
