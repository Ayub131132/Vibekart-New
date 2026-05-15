# Vibekart Deployment Guide

This document outlines the environment variables and steps required to deploy Vibekart to production.

## 1. Frontend Environment Variables (.env)
Located in the root directory.

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Project API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | project-id.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | project-id.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID |
| `VITE_FIREBASE_VAPID_KEY` | Firebase Cloud Messaging VAPID Key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay API Key ID (Production) |
| `VITE_BACKEND_URL` | Production Backend URL (e.g., https://api.vibekart.com) |
| `VITE_SUPER_ADMIN_EMAIL` | The email address of the primary owner |

## 2. Backend Environment Variables (backend/.env)
Located in the `backend/` directory.

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the server (defaults to 5000) |
| `EMAIL_USER` | Gmail address for sending OTPs/Notifications |
| `EMAIL_PASS` | Gmail App Password (NOT your regular password) |
| `SUPER_ADMIN_EMAIL` | Must match VITE_SUPER_ADMIN_EMAIL |
| `STORAGE_BUCKET` | project-id.firebasestorage.app |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `RAZORPAY_KEY_ID` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |

## 3. Important Files
- `backend/serviceAccountKey.json`: This file is **REQUIRED** for the backend to interact with Firebase. Generate it in Firebase Console > Project Settings > Service Accounts. It is ignored by git for security.

## 4. Deployment Steps
1. **Rotate Secrets:** If you have committed any keys to version control previously, rotate your Firebase API Key and Razorpay Secrets immediately.
2. **Build:** Run `npm run build` to generate the production-ready `dist/` folder.
3. **CORS:** Ensure `backend/server.js` CORS options include your production frontend domain.
4. **Environment:** Set the above variables in your hosting provider (e.g., Vercel, Railway, Heroku).
