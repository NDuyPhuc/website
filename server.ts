import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import PayOS from "@payos/node";
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
// Note: In AI Studio, the environment is already set up if Firebase was initialized.
// We assume the service account or default credentials are available.
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize PayOS
const payos = new (PayOS as any)(
  process.env.PAYOS_CLIENT_ID || "REPLACE_WITH_YOUR_PAYOS_CLIENT_ID",
  process.env.PAYOS_API_KEY || "REPLACE_WITH_YOUR_PAYOS_API_KEY",
  process.env.PAYOS_CHECKSUM_KEY || "REPLACE_WITH_YOUR_PAYOS_CHECKSUM_KEY"
);

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// API Routes

// 1. Create Top-up Order
app.post("/api/create-topup-order", async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate a unique numeric order code (PayOS requirement)
    const orderCode = Number(String(Date.now()).slice(-8)); 
    
    // Create a pending order in Firestore
    const orderRef = db.collection('paymentOrders').doc(String(orderCode));
    const orderData = {
      userId,
      orderCode,
      amount,
      credits: amount, // 1:1 ratio for demo
      status: 'PENDING',
      description: description || `Titan Forge Wallet Top-up`,
      provider: 'payOS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      webhookVerified: false
    };

    await orderRef.set(orderData);

    // Call PayOS to create payment link
    const domain = process.env.APP_URL || `http://localhost:${PORT}`;
    const paymentData = {
      orderCode: orderCode,
      amount: amount,
      description: `TOPUP ${orderCode}`,
      cancelUrl: `${domain}/wallet?status=cancelled&orderCode=${orderCode}`,
      returnUrl: `${domain}/wallet?status=success&orderCode=${orderCode}`,
    };

    const paymentLinkRes = await payos.createPaymentLink(paymentData);

    await orderRef.update({
      paymentLinkId: paymentLinkRes.paymentLinkId,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || ''
    });

    res.json({
      success: true,
      orderCode,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode
    });

  } catch (error: any) {
    console.error("PayOS Create Error:", error);
    res.status(500).json({ error: error.message || "Failed to create payment" });
  }
});

// 2. PayOS Webhook
app.post("/api/payos-webhook", async (req, res) => {
  try {
    const webhookData = req.body;
    const verifiedData = payos.verifyPaymentWebhookData(webhookData);
    
    if (verifiedData.code === '00' && verifiedData.desc === 'success') {
      const orderCode = verifiedData.orderCode;
      const amount = verifiedData.amount;

      const orderRef = db.collection('paymentOrders').doc(String(orderCode));
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const currentOrder = orderSnap.data()!;
      if (currentOrder.status === 'PAID') {
        return res.json({ success: true, message: "Already processed" });
      }

      const userId = currentOrder.userId;

      await db.runTransaction(async (transaction) => {
        const walletRef = db.collection('wallets').doc(userId);
        const walletSnap = await transaction.get(walletRef);

        let currentBalance = 0;
        if (walletSnap.exists) {
          currentBalance = walletSnap.data()?.balance || 0;
        }

        const newBalance = currentBalance + amount;

        transaction.set(walletRef, {
          balance: newBalance,
          userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const txRef = db.collection('walletTransactions').doc();
        transaction.set(txRef, {
          userId,
          type: 'TOPUP',
          amount: amount,
          credits: amount,
          status: 'COMPLETED',
          orderCode,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        transaction.update(orderRef, {
          status: 'PAID',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookVerified: true
        });
        
        const userRef = db.collection('users').doc(userId);
        transaction.set(userRef, {
          totalTopup: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Webhook handling failed" });
  }
});

async function init() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for unknown routes (SPA fallback)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not in serverless environment
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

init();

export default app;
