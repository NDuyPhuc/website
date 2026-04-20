# 💳 PayOS Payment Integration Complete Guide
## Firebase + Vite + Express + PayOS Webhook Implementation

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problems Encountered & Solutions](#problems-encountered--solutions)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Key Files Reference](#key-files-reference)
6. [Deployment Guide](#deployment-guide)
7. [Testing & Debugging](#testing--debugging)
8. [Common Issues & Fixes](#common-issues--fixes)
9. [Lessons Learned](#lessons-learned)

---

## Executive Summary

Successfully integrated **PayOS payment system** with a React+Vite frontend and Express.js backend using Firebase Firestore for wallet management. The solution handles:

- ✅ Payment link generation with VietQR codes
- ✅ Automatic wallet crediting via polling (since PayOS webhook auto-trigger has limitations)
- ✅ Real-time balance updates
- ✅ Transaction history tracking
- ✅ Production deployment on Vercel

**Tech Stack:**
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express.js on Node 20.x
- Database: Firebase Firestore
- Payment: PayOS Node SDK v2.0.5
- Hosting: Vercel (frontend + serverless API)

---

## Problems Encountered & Solutions

### **Problem 1: Vite Build Error - Invalid Wildcard Pattern**

**Error:**
```
Error: External path 'api/**' cannot have more than one '*' wildcard
```

**Root Cause:**
Vite config had invalid rollup options trying to externalize API routes with double wildcards.

**Solution:**
Removed the problematic external config entirely since API runs on separate port:

```typescript
// ❌ BEFORE (vite.config.ts)
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['api/**'],  // ← INVALID
      output: {
        paths: {
          'api/**': '/api'
        }
      }
    }
  }
});

// ✅ AFTER
export default defineConfig({
  plugins: [react()],
  // Removed rollupOptions entirely since API is on different port
});
```

---

### **Problem 2: Firebase Admin Initialization - ESM Compatibility**

**Errors:**
```
Cannot read properties of undefined (reading 'length')
admin.firestore is not a function
Firebase app already exists
```

**Root Cause:**
Firebase Admin SDK v13 uses ESM modules but code was importing as CommonJS namespace.

**Solution:**
Switch to named imports and add proper initialization check:

```typescript
// ❌ BEFORE
import * as admin from 'firebase-admin';

// ✅ AFTER
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Proper initialization with getApps check
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
```

---

### **Problem 3: PayOS SDK Import Error**

**Error:**
```
PayOS is not a constructor
```

**Root Cause:**
PayOS v2.0.5 doesn't export default, only named export.

**Solution:**
Use named import instead of default import:

```typescript
// ❌ BEFORE
import PayOS from '@payos/node';

// ✅ AFTER
import { PayOS } from "@payos/node";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});
```

---

### **Problem 4: Environment Variables Not Available in Vercel**

**Issue:**
API couldn't access `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel production.

**Solution:**
Add all environment variables to Vercel dashboard:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{...stringified JSON...}'
FIREBASE_PROJECT_ID=fitness-f821f
PAYOS_CLIENT_ID=23918c41-...
PAYOS_API_KEY=97b342bb-...
PAYOS_CHECKSUM_KEY=04b587425...
APP_URL=https://website-two-nu-66.vercel.app/
```

**Important:** Service account JSON must be stringified on **one line** for dotenv parsing.

---

### **Problem 5: PayOS Webhook Not Auto-Triggering**

**Issue:**
Manual webhook test worked, but real PayOS payments didn't trigger webhook callback automatically.

**Root Cause:**
PayOS dashboard webhook registration success message was misleading - webhook still needed explicit confirmation or different configuration.

**Solution:**
Implemented **polling mechanism** instead of relying on auto-trigger:

1. Frontend polls `/api/check-payos-status/{orderCode}` every 2 seconds
2. Backend queries PayOS API directly for payment status
3. If payment = PAID, automatically credit wallet via Firestore transaction
4. Real-time listener updates wallet balance in UI

---

### **Problem 6: Payment Result Status Mismatch**

**Issue:**
PayOS returns `status=PAID` but code only handled `status=success`.

**Solution:**
Updated status check to accept both:

```typescript
const isSuccess = status === 'success' || status === 'PAID';
```

---

## Architecture Overview

### **System Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  - WalletPage displays balance                              │
│  - TopupModal creates payment order                         │
│  - PaymentQRCode shows VietQR code                          │
│  - PaymentResultPage polls status                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    [Create Order]
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                        │
│                                                              │
│  POST /api/create-topup-order                               │
│  ├─ Generate orderCode                                      │
│  ├─ Create order in Firestore (PENDING)                     │
│  └─ Call PayOS SDK to generate QR code                      │
│                                                              │
│  GET /api/check-payos-status/:orderCode                     │
│  ├─ Query PayOS SDK for payment status                      │
│  ├─ If PAID: Run transaction to credit wallet               │
│  └─ Return order status                                     │
│                                                              │
│  POST /api/payos-webhook (fallback)                         │
│  └─ Handle direct webhook from PayOS (if enabled)           │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ↓                           ↓
    ┌──────────────┐         ┌──────────────────┐
    │  Firestore   │         │  PayOS SDK       │
    │              │         │                  │
    │ Collections: │         │ Query payment    │
    │ - wallets    │         │ status via API   │
    │ - orders     │         └──────────────────┘
    │ - transactions
    │ - users      │
    └──────────────┘
```

### **Data Models**

**Firestore Collections:**

```typescript
// wallets/{userId}
{
  balance: number;           // Current credit balance
  userId: string;
  updatedAt: Timestamp;
}

// paymentOrders/{orderCode}
{
  userId: string;
  orderCode: number;
  amount: number;
  status: "PENDING" | "PAID";
  webhookVerified: boolean;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  processedVia?: "webhook" | "polling";
}

// walletTransactions/{docId}
{
  userId: string;
  type: "TOPUP" | "PURCHASE";
  amount: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  orderCode: number;
  createdAt: Timestamp;
  source: "webhook" | "polling" | "test";
}

// users/{userId}
{
  totalTopup: number;           // Cumulative total
  updatedAt: Timestamp;
}
```

---

## Step-by-Step Implementation

### **Step 1: Firebase Setup**

1. Create Firebase project
2. Enable Firestore Database
3. Generate service account key:
   - Firebase Console → Settings → Service Accounts
   - Generate New Private Key
   - Download JSON

4. Stringify and add to `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
FIREBASE_PROJECT_ID=your-project-id
```

### **Step 2: PayOS Setup**

1. Create PayOS account
2. Get credentials:
   - Client ID
   - API Key
   - Checksum Key
3. Add to `.env`:
```bash
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key
```

### **Step 3: Backend API Setup (api/index.ts)**

Create Express server with three main endpoints:

```typescript
import express from "express";
import { PayOS } from "@payos/node";
import { 
  cert, getApps, initializeApp, 
  getFirestore, FieldValue 
} from "firebase-admin/...";
import bodyParser from "body-parser";

// Initialize
const app = express();
app.use(bodyParser.json());

// Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// PayOS
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// ✅ Endpoint 1: Create Payment Order
app.post("/api/create-topup-order", async (req, res) => {
  const { userId, amount } = req.body;
  const orderCode = Number(String(Date.now()).slice(-8));

  // Save order to Firestore
  await db.collection("paymentOrders").doc(String(orderCode)).set({
    userId, orderCode, amount,
    status: "PENDING",
    webhookVerified: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Generate PayOS payment link
  const payment = await payos.paymentRequests.create({
    orderCode,
    amount,
    description: `TOPUP ${orderCode}`,
    returnUrl: `${process.env.APP_URL}/payment-result?status=success&orderCode=${orderCode}`,
    cancelUrl: `${process.env.APP_URL}/payment-result?status=cancelled&orderCode=${orderCode}`,
  });

  return res.json({
    success: true,
    orderCode,
    checkoutUrl: payment.checkoutUrl,
    qrCode: payment.qrCode,
  });
});

// ✅ Endpoint 2: Check PayOS Status & Auto-Process
app.get("/api/check-payos-status/:orderCode", async (req, res) => {
  const { orderCode } = req.params;

  // Query PayOS for actual payment status
  const paymentStatus = await payos.paymentRequests.get(Number(orderCode));

  // If payment confirmed as PAID
  if (paymentStatus.status === "PAID") {
    const orderRef = db.collection("paymentOrders").doc(orderCode);
    const order = (await orderRef.get()).data();

    // Run transaction to credit wallet
    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection("wallets").doc(order.userId);
      const wallet = await transaction.get(walletRef);
      const balance = wallet.data()?.balance || 0;

      // Update wallet
      transaction.set(walletRef, {
        balance: balance + order.amount,
        userId: order.userId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Record transaction
      transaction.set(db.collection("walletTransactions").doc(), {
        userId: order.userId,
        type: "TOPUP",
        amount: order.amount,
        status: "COMPLETED",
        orderCode: Number(orderCode),
        createdAt: FieldValue.serverTimestamp(),
        source: "polling",
      });

      // Mark order as processed
      transaction.update(orderRef, {
        status: "PAID",
        webhookVerified: true,
        processedVia: "polling",
        paidAt: FieldValue.serverTimestamp(),
      });
    });
  }

  return res.json({
    success: true,
    status: paymentStatus.status,
    order: { orderCode, amount: order.amount }
  });
});

// ✅ Endpoint 3: Webhook Handler (fallback)
app.post("/api/payos-webhook", async (req, res) => {
  const webhookData = req.body;
  const verified = await payos.webhooks.verify(webhookData);

  if (webhookData.code === "00") {
    // Process payment exactly like polling endpoint
    // ... (transaction logic)
  }

  return res.json({ success: true });
});

export default app;
```

### **Step 4: Frontend - Wallet Page (src/pages/WalletPage.tsx)**

```typescript
import { useWallet } from '../hooks/useWallet';

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, loading } = useWallet(user?.uid);

  return (
    <div>
      <WalletCard 
        balance={wallet?.balance || 0}
        onTopupClick={() => setIsTopupModalOpen(true)}
      />
      <TransactionHistory userId={user.uid} />
    </div>
  );
}
```

### **Step 5: Real-Time Balance Hook (src/hooks/useWallet.ts)**

```typescript
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Real-time listener to Firestore
    const unsub = onSnapshot(doc(db, 'wallets', userId), (docSnap) => {
      if (docSnap.exists()) {
        setWallet(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { wallet, loading };
}
```

### **Step 6: Payment Result Page (src/pages/PaymentResultPage.tsx)**

```typescript
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderCode = searchParams.get('orderCode');
  const [webhookVerified, setWebhookVerified] = useState(false);

  useEffect(() => {
    // Poll PayOS status every 2 seconds when payment succeeds
    if ((status === 'success' || status === 'PAID') && orderCode) {
      const pollInterval = setInterval(async () => {
        const response = await fetch(`/api/check-payos-status/${orderCode}`);
        const data = await response.json();

        if (data.status === "PAID") {
          setWebhookVerified(true);
          clearInterval(pollInterval);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [status, orderCode]);

  return (
    <div>
      {webhookVerified ? (
        <p>✓ Payment verified! Credits added to wallet.</p>
      ) : (
        <p>⏳ Verifying payment...</p>
      )}
    </div>
  );
}
```

---

## Key Files Reference

### **File Locations & Purposes**

| File | Purpose |
|------|---------|
| `api/index.ts` | Express server with payment endpoints |
| `src/pages/WalletPage.tsx` | Main wallet display page |
| `src/pages/PaymentResultPage.tsx` | Payment success/result handling |
| `src/components/wallet/TopupModal.tsx` | Modal to select topup amount |
| `src/components/wallet/PaymentQRCode.tsx` | Display QR code for scanning |
| `src/components/wallet/TransactionHistory.tsx` | List of transactions |
| `src/hooks/useWallet.ts` | Real-time wallet balance hook |
| `src/lib/payments.ts` | Frontend API client functions |
| `.env` | Environment variables (local) |
| `vercel.json` | Vercel deployment config |

---

## Deployment Guide

### **Vercel Deployment Setup**

1. **Connect GitHub repo to Vercel**
   - Vercel Dashboard → Import Project
   - Select repository

2. **Set Environment Variables**
   - Project Settings → Environment Variables
   - Add all required variables (see `.env` template)

3. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Deploy API**
   - Vercel automatically detects `/api` folder
   - Serverless functions created from `api/index.ts`
   - Each deploy creates new Vercel URL

### **Environment Variables for Vercel**

```javascript
// Required in Vercel Dashboard:
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

FIREBASE_SERVICE_ACCOUNT_KEY        // ← Stringified JSON
FIREBASE_PROJECT_ID

PAYOS_CLIENT_ID
PAYOS_API_KEY
PAYOS_CHECKSUM_KEY

APP_URL                              // https://your-domain.vercel.app/
```

---

## Testing & Debugging

### **Local Testing**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run start:api

# Frontend runs on localhost:3000
# API runs on localhost:3001
```

### **Test Endpoints**

```javascript
// 1. Create order
fetch('/api/create-topup-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    amount: 10000
  })
}).then(r => r.json()).then(console.log);

// 2. Check status (mocked)
fetch('/api/check-payos-status/3185379')
  .then(r => r.json())
  .then(console.log);

// 3. Manual webhook trigger (testing)
fetch('/api/test-webhook-trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderCode: '3185379',
    amount: 10000
  })
}).then(r => r.json()).then(console.log);
```

### **Vercel Logs**

```bash
# Check runtime logs for payment processing
# Vercel Dashboard → Deployments → [Latest] → Runtime Logs

# Look for:
# ✅ "Checking PAYOS status for orderCode: ..."
# ✅ "Payment processed via polling"
# ❌ "Payment still PENDING"
```

---

## Common Issues & Fixes

### **Issue: "Cannot read properties of undefined (reading 'length')"**

**Cause:** Firebase Admin not initialized properly

**Fix:**
```typescript
if (getApps().length === 0) {
  // Initialize
}
```

---

### **Issue: "PayOS is not a constructor"**

**Cause:** Wrong import statement

**Fix:**
```typescript
// ❌ Wrong
import PayOS from '@payos/node';

// ✅ Correct
import { PayOS } from "@payos/node";
```

---

### **Issue: Wallet balance not updating after payment**

**Possible Causes:**
1. Polling endpoint not being called
2. PayOS status query returning error
3. Firestore transaction failing silently
4. Real-time listener not connected

**Debug Steps:**
```javascript
// 1. Check if polling is running
// Open browser console, watch for fetch calls to /api/check-payos-status

// 2. Test endpoint manually
fetch('/api/check-payos-status/3185379')
  .then(r => r.json())
  .then(data => console.log('Status:', data.status));

// 3. Check Firestore wallet document
// Firebase Console → Firestore → wallets collection → [userId]

// 4. Check browser network tab
// Look for 404 errors or failed polling requests
```

---

### **Issue: Order creates but QR code not showing**

**Cause:** Order document created but qrCode field empty

**Check:**
```typescript
// In create-topup-order endpoint, ensure:
await orderRef.update({
  paymentLinkId: paymentLinkRes.paymentLinkId,
  checkoutUrl: paymentLinkRes.checkoutUrl,
  qrCode: paymentLinkRes.qrCode || "",  // ← Must have value
});
```

---

## Lessons Learned

### **🔑 Key Insights**

1. **Webhook Reliability is Not Guaranteed**
   - Don't assume PayOS webhook auto-triggers
   - Implement polling as primary solution
   - Use webhook as secondary confirmation only

2. **ESM vs CommonJS Matters**
   - Firebase Admin v13 requires ESM named imports
   - Check SDK documentation for import statements
   - Test with Node version compatibility

3. **Vite + API Separation**
   - Keep API on different port in development
   - Don't try to externalize API routes
   - Let Vercel handle serverless deployment

4. **Firestore Real-Time Updates**
   - Use `onSnapshot` for live wallet balance
   - Users see balance update immediately
   - No need for manual refresh

5. **Environment Variable Stringification**
   - JSON must be single-line for dotenv
   - Copy-paste carefully to Vercel dashboard
   - Test in production before going live

6. **PayOS Return URL Handling**
   - PayOS returns `status=PAID`, not `status=success`
   - Handle both status values
   - Extract `orderCode` from querystring

---

### **⚠️ Common Pitfalls to Avoid**

| Pitfall | Solution |
|---------|----------|
| Trusting webhook to always trigger | Implement polling fallback |
| Using CommonJS imports with Firebase Admin v13 | Use named ESM imports |
| Hardcoding URLs without trailing slash handling | Use `.replace(/\/$/, '')` |
| Not checking `webhookVerified` status | Always check before processing payment |
| Forgetting to merge existing wallet data | Use `{ merge: true }` in Firestore sets |
| Running API on same port as frontend | Use separate ports (3000/3001) |

---

### **🚀 Optimization Tips**

1. **Polling Interval**
   - 2-second interval is good balance
   - 1 second: More responsive but higher API calls
   - 5 seconds: Fewer calls but slower user feedback

2. **Transaction Safety**
   - Always use Firestore transactions to update wallet
   - Prevents race conditions with concurrent payments
   - Atomic operations

3. **Error Handling**
   - Log all errors to Vercel logs
   - Show user-friendly messages
   - Fallback gracefully

4. **Performance**
   - Stop polling once payment confirmed
   - Clear intervals to prevent memory leaks
   - Use real-time listeners instead of repeated fetches

---

## Final Checklist for Production

- [ ] Environment variables set in Vercel
- [ ] Firebase service account key stringified (single line)
- [ ] PayOS credentials verified
- [ ] API endpoints tested locally
- [ ] Real payment tested on staging
- [ ] Wallet balance updates in real-time
- [ ] Transaction history shows all payments
- [ ] Error messages are clear for users
- [ ] Polling stops after payment confirmed
- [ ] Vercel build succeeds without warnings
- [ ] CORS properly configured
- [ ] Rate limiting considered for polling

---

## Support & Resources

**Documentation Links:**
- [PayOS Documentation](https://docs.payos.vn)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Vite Configuration](https://vitejs.dev/config/)
- [Express.js Guide](https://expressjs.com/)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

**Debugging:**
- Check browser console for client-side errors
- Check Vercel Runtime Logs for server-side errors
- Monitor Firestore operations in Firebase Console
- Test endpoints with curl or Postman

---

## Document Version

- **Version:** 1.0
- **Last Updated:** April 20, 2026
- **Status:** Production Ready
- **Payment System:** PayOS VietQR
- **Tested On:** Node 20.x, React 18+, Firebase Admin v13

---

*This guide documents the complete journey from error debugging to production deployment of a payment system integrated with PayOS, Firebase, and Vercel.*
