# Titan Forge Fitness - YouTube Demo Guide

This project is a production-ready demonstration of integrating Firebase with a premium React landing page.

## 🚀 Setup Instructions

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `Titan Forge Fitness`.
3. Enable **Authentication** and activate the **Email/Password** provider.
4. Create a **Firestore Database** in production mode.
5. Deploy the provided `firestore.rules` to the "Rules" tab in Firestore.
6. Register a **Web App** and copy the `firebaseConfig`.
7. (Optional) Enable **App Check** with reCAPTCHA Enterprise for production security.

### 2. Environment Variables
Create a `.env` file in the root or add these to **Vercel** with the `VITE_` prefix:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_RECAPTCHA_SITE_KEY`

## 📺 Video Demo Steps

### 1. The Landing Page
Show off the premium Titan Forge branding. Explain that it’s built with React, Tailwind, and Motion.

### 2. Sign Up & Auth Persistence
- Click **JOIN NOW**.
- Create a new account.
- Show the **Loader** (Titan Forge Cloud sync).
- Show that the user is redirected to the **Athlete Dashboard**.
- Refresh the page and show that the session persists.

### 3. Profile CRUD (Firestore)
- Update the "Fitness Goal" or "Preferred Time".
- Click **SYNC CHANGES**.
- Show the success animation and observe the real-time update in the dashboard metrics.

### 4. Real-time Announcements
- Open the app in **two browser tabs** side-by-side.
- In the Firebase Console, manually add a document to the `liveAnnouncements` collection:
  ```json
  {
    "title": "FLASH SALE",
    "message": "50% off all PT sessions for the next 2 hours!",
    "type": "warning",
    "createdAt": "[Current Timestamp]"
  }
  ```
- Watch both tabs update **instantly** without a refresh. This is the "Aha!" moment for viewers.

### 5. Access Protection
- Log out of the account.
- Show that the dashboard is hidden and the landing page returns.
- Explain that security rules prevent unauthenticated access to `users/{uid}`.

## 🛡️ Security Note
The `firestore.rules` ensure users can only edit their own profile. PII (emails) are locked down behind `isOwner(userId)`.

---
*Created for the Titan Forge Youtube Series*
