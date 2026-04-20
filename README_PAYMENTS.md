# Titan Forge Wallet System (payOS Integration)

This module implements a complete production-grade wallet system using **payOS** for VietQR payments and **Firebase** for data persistence.

## 🛠 Features
- **Instant Top-up**: Real-time balance updates via payOS webhooks.
- **VietQR Integration**: Dynamic QR code generation for scanning in any bank app.
- **Secure Ledger**: Server-side balance updates using Firebase Admin Transactions.
- **Transaction History**: Real-time list of all financial movements.
- **Strict Security**: Firestore rules prevent client-side balance manipulation.

## 🚀 Setup Instructions

### 1. payOS Configuration
1. Register at [payOS.vn](https://payos.vn).
2. Create a new App and get your credentials:
   - `Client ID`
   - `API Key`
   - `Checksum Key`
3. Configure your **Webhook URL** in payOS Dashboard:
   - URL: `https://<YOUR_APP_URL>/api/payos-webhook`
   - Ensure you replace `<YOUR_APP_URL>` with your actual deployment URL (e.g., from Cloud Run or Vercel).

### 2. Environment Variables
Add the following to your `.env` (Vercel/Local):
```env
PAYOS_CLIENT_ID=REPLACE_WITH_YOUR_CLIENT_ID
PAYOS_API_KEY=REPLACE_WITH_YOUR_API_KEY
PAYOS_CHECKSUM_KEY=REPLACE_WITH_YOUR_CHECKSUM_KEY
APP_URL=https://your-app-url.vercel.app
```

### 3. Firebase Deployment
1. **Firestore Rules**: Deploy the rules provided in `firestore.rules`.
2. **Cloud Functions (Optional)**: If you are not using the Express server provided in `server.ts`, you can port the routes to Firebase Functions.

## 📱 User Flow
1. **Profile**: View balance and total top-up stats.
2. **Wallet**: Click "TOP UP" select amount.
3. **Payment**: Scan the VietQR code with a bank app.
4. **Success**: The balance updates automatically without refreshing the page thanks to Firestore listeners.

## 🔒 Security Notes
- **Webhooks**: Validated using PayOS signature verification.
- **Idempotency**: Prevent double-crediting by checking order status before updating balance.
- **Access Control**: Users can only see their own transactions and wallet info.
