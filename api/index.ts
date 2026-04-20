import express from "express";
import path from "path";
import PayOS from "@payos/node";
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
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

// 1. Create Top-up Order
app.post("/api/create-topup-order", async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: "Missing required fields" });

    const orderCode = Number(String(Date.now()).slice(-8)); 
    const orderRef = db.collection('paymentOrders').doc(String(orderCode));
    await orderRef.set({
      userId, orderCode, amount, credits: amount,
      status: 'PENDING', description: description || `Titan Forge Wallet Top-up`,
      provider: 'payOS', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      webhookVerified: false
    });

    const domain = process.env.APP_URL || `http://localhost:${PORT}`;
    const paymentLinkRes = await payos.createPaymentLink({
      orderCode, amount, description: `TOPUP ${orderCode}`,
      cancelUrl: `${domain}/wallet?status=cancelled&orderCode=${orderCode}`,
      returnUrl: `${domain}/wallet?status=success&orderCode=${orderCode}`,
    });

    await orderRef.update({
      paymentLinkId: paymentLinkRes.paymentLinkId,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode || ''
    });

    res.json({ success: true, orderCode, checkoutUrl: paymentLinkRes.checkoutUrl, qrCode: paymentLinkRes.qrCode });
  } catch (error: any) {
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
      if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

      const currentOrder = orderSnap.data()!;
      if (currentOrder.status === 'PAID') return res.json({ success: true });

      const userId = currentOrder.userId;
      await db.runTransaction(async (transaction) => {
        const walletRef = db.collection('wallets').doc(userId);
        const walletSnap = await transaction.get(walletRef);
        const newBalance = (walletSnap.exists ? walletSnap.data()?.balance : 0) + amount;

        transaction.set(walletRef, { balance: newBalance, userId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        transaction.set(db.collection('walletTransactions').doc(), {
          userId, type: 'TOPUP', amount, credits: amount, status: 'COMPLETED', orderCode, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        transaction.update(orderRef, { status: 'PAID', paidAt: admin.firestore.FieldValue.serverTimestamp(), webhookVerified: true });
        transaction.set(db.collection('users').doc(userId), { totalTopup: admin.firestore.FieldValue.increment(amount), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Webhook handling failed" });
  }
});

// Init logic
async function init() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid loading Vite/Rollup binaries in production (Vercel)
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => console.log(`Dev server running on port ${PORT}`));
  } else {
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
      });
      app.listen(PORT, "0.0.0.0", () => console.log(`Production server running on port ${PORT}`));
    }
  }
}

init();

export default app;
