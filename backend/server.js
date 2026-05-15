const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const { z } = require('zod');
require('dotenv').config();

const app = express();

// 1. Restricted CORS (Production-ready)
const corsOptions = {
  origin: [
    'https://vibekart.com', 
    'https://admin.vibekart.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));

// 2. Standardized Error Response Utility
const sendError = (res, status, code, message, details = null) => {
  return res.status(status).json({
    error: true,
    code,
    message,
    details
  });
};

// 3. Zod Validation Schemas
const schemas = {
  product: z.object({
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    description: z.string().min(10),
    category: z.string(),
    stock: z.number().int().min(0),
    image: z.string().url()
  }),
  order: z.object({
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number().int().positive()
    })).min(1),
    address: z.string().min(10),
    paymentMethod: z.enum(['COD', 'Razorpay'])
  }),
  razorpayOrder: z.object({
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number().int().positive()
    })).min(1),
    currency: z.string().default('INR')
  }),
  email: z.object({
    email: z.string().email()
  }),
  otp: z.object({
    email: z.string().email(),
    otp: z.string().length(6)
  }),
  sendOtp: z.object({
    email: z.string().email(),
    type: z.enum(['login', 'signup'])
  }),
  updateProfile: z.object({
    uid: z.string(),
    updates: z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      photoURL: z.string().url().optional(),
      addressLine: z.string().optional(),
      selectedState: z.string().optional(),
      selectedDistrict: z.string().optional(),
      villageCity: z.string().optional(),
      pinCode: z.string().optional(),
      phoneNumber: z.string().optional()
    })
  }),
  coupon: z.object({
    code: z.string().min(3),
    discount: z.number().positive(),
    type: z.enum(['percentage', 'fixed']).optional(),
    expiryDate: z.string().optional()
  })
};

const validateBody = (schema) => (req, res, next) => {
  const validation = schema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 400, 'INVALID_INPUT', 'Invalid input data', validation.error.format());
  }
  req.validatedBody = validation.data;
  next();
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Unauthorized: No token provided');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return sendError(res, 401, 'INVALID_TOKEN', 'Unauthorized: Invalid token');
  }
};

const isAdmin = (req, res, next) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || '').trim().toLowerCase();
  const userEmail = (req.user && req.user.email || '').trim().toLowerCase();
  
  if (req.user && (req.user.admin === true || (userEmail && superAdminEmail && userEmail === superAdminEmail))) {
    next();
  } else {
    console.warn(`Admin access denied for: ${userEmail}. Expected: ${superAdminEmail} or admin claim.`);
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized: Admin access only');
  }
};

// Endpoint to promote a user to admin
app.post('/admin/promote', verifyToken, async (req, res) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || '').trim().toLowerCase();
  const userEmail = (req.user && req.user.email || '').trim().toLowerCase();

  // Only existing admins or the super admin can promote others
  if (req.user.admin !== true && !(userEmail && superAdminEmail && userEmail === superAdminEmail)) {
    return sendError(res, 403, 'FORBIDDEN', 'Only admins can promote others');
  }
  
  const { uid } = req.body;
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    res.status(200).json({ message: `User ${uid} promoted to admin` });
  } catch (error) {
    return sendError(res, 500, 'PROMOTION_FAILED', 'Failed to promote user');
  }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Endpoint to upload images to Cloudinary via backend proxy.
 */
app.post('/upload-image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'NO_FILE', 'No file uploaded');
  }

  try {
    // Upload to Cloudinary using a promise to handle the stream
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'vibekart_uploads',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    return sendError(res, 500, 'UPLOAD_FAILED', 'Failed to upload image');
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=';
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

/**
 * Endpoint to create a Razorpay order.
 */
app.post('/create-razorpay-order', verifyToken, validateBody(schemas.razorpayOrder), async (req, res) => {
  const { items, currency } = req.validatedBody;

  try {
    let total = 0;
    // Securely calculate total from DB
    for (const item of items) {
      const productDoc = await db.collection('products').doc(item.id).get();
      if (!productDoc.exists) throw new Error(`Product not found: ${item.id}`);
      const productData = productDoc.data();
      total += productData.price * item.quantity;
    }

    const options = {
      amount: Math.round(total * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    return sendError(res, 500, 'ORDER_CREATION_FAILED', error.message || 'Failed to create Razorpay order');
  }
});

/**
 * Helper to handle the actual order placement in Firestore.
 */
const finalizeOrder = async (uid, items, address, paymentMethod, razorpayId = null) => {
  return await db.runTransaction(async (transaction) => {
    let total = 0;
    const itemDetails = [];
    const productUpdates = [];

    for (const item of items) {
      const productRef = db.collection('products').doc(item.id);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) throw new Error(`Product not found: ${item.id}`);

      const productData = productDoc.data();
      if (productData.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${productData.name}.`);
      }

      total += productData.price * item.quantity;
      itemDetails.push({ 
        id: item.id,
        name: productData.name,
        price: productData.price,
        quantity: item.quantity,
        image: productData.image
      });
      productUpdates.push({ ref: productRef, newStock: productData.stock - item.quantity });
    }

    const orderRef = db.collection('orders').doc();
    const orderData = {
      orderId: orderRef.id,
      uid,
      items: itemDetails,
      total: parseFloat(total.toFixed(2)),
      address,
      paymentMethod,
      razorpayOrderId: razorpayId,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    transaction.set(orderRef, orderData);
    productUpdates.forEach(u => transaction.update(u.ref, { stock: u.newStock }));
    transaction.set(db.collection('carts').doc(uid), { items: [], updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    transaction.update(db.collection('users').doc(uid), { totalOrders: admin.firestore.FieldValue.increment(1) });

    return { orderId: orderRef.id, total };
  });
};

app.post('/verify-payment', verifyToken, async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    items,
    address 
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    try {
      // items and address should also be validated here
      const result = await finalizeOrder(req.user.uid, items, address, 'Razorpay', razorpay_order_id);
      res.status(200).send({ message: 'Payment verified and order placed', ...result });
    } catch (error) {
      console.error('Finalize order error:', error);
      return sendError(res, 400, 'ORDER_FINALIZATION_FAILED', error.message || 'Failed to place order after payment');
    }
  } else {
    return sendError(res, 400, 'INVALID_SIGNATURE', 'Invalid payment signature');
  }
});

app.post('/check-user', async (req, res) => {
  const { email } = req.body;
  try {
    await admin.auth().getUserByEmail(email);
    res.status(200).json({ exists: true });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      res.status(200).json({ exists: false });
    } else {
      return sendError(res, 500, 'USER_CHECK_FAILED', 'Error checking user');
    }
  }
});

app.post('/send-otp', validateBody(schemas.sendOtp), async (req, res) => {
  const { email, type } = req.validatedBody;

  try {
    const userExists = await admin.auth().getUserByEmail(email).then(() => true).catch(() => false);
    if (type === 'login' && !userExists) return sendError(res, 404, 'USER_NOT_FOUND', 'User not found. Please sign up first.');
    if (type === 'signup' && userExists) return sendError(res, 400, 'USER_EXISTS', 'User already exists. Please log in.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { code: otp, expires: Date.now() + 5 * 60 * 1000 };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your Vibekart ${type === 'login' ? 'Login' : 'Signup'} OTP`,
      text: `Your OTP is: ${otp}`
    });
    res.status(200).json({ message: 'OTP sent' });
  } catch (error) {
    return sendError(res, 500, 'OTP_SEND_FAILED', 'Error sending OTP');
  }
});

app.post('/verify-otp', validateBody(schemas.otp), async (req, res) => {
  const { email, otp } = req.validatedBody;
  const storedData = otpStore[email];

  if (!storedData || storedData.expires < Date.now() || storedData.code !== otp) {
    return sendError(res, 400, 'INVALID_OTP', 'Invalid or expired OTP');
  }

  delete otpStore[email];
  
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
      // Signup: Create Auth User
      userRecord = await admin.auth().createUser({
        email,
        photoURL: `${DEFAULT_AVATAR}${email.split('@')[0]}`,
        displayName: email.split('@')[0]
      });

      // Create Firestore Profile with 10-digit Numeric UID
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        numericUid: generateNumericUid(),
        email: userRecord.email,
        displayName: userRecord.displayName,
        username: email.split('@')[0],
        photoURL: userRecord.photoURL,
        totalOrders: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bio: 'I am a vibe shopper!'
      });
    }

    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    res.status(200).json({ token: customToken });
  } catch (error) {
    console.error('Verify error:', error);
    return sendError(res, 500, 'VERIFICATION_FAILED', 'Verification failed');
  }
});

app.get('/user-profile/:uid', verifyToken, async (req, res) => {
  // Only allow users to see their own profile or an admin
  if (req.user.uid !== req.params.uid && req.user.admin !== true) {
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
  }

  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) return sendError(res, 404, 'NOT_FOUND', 'Profile not found');
    res.status(200).json(userDoc.data());
  } catch (error) {
    return sendError(res, 500, 'PROFILE_FETCH_FAILED', 'Error fetching profile');
  }
});

app.post('/request-email-change-otp', verifyToken, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return sendError(res, 400, 'EMAIL_REQUIRED', 'New email is required');

  try {
    // Check if email already in use
    const userExists = await admin.auth().getUserByEmail(newEmail).then(() => true).catch(() => false);
    if (userExists) return sendError(res, 400, 'EMAIL_IN_USE', 'Email already in use');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP specifically for email change
    otpStore[`email-change-${req.user.uid}`] = { 
      code: otp, 
      newEmail, 
      expires: Date.now() + 10 * 60 * 1000 
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newEmail,
      subject: 'Vibekart Email Change Verification',
      text: `Your OTP for changing your Vibekart account email to this address is: ${otp}. This OTP expires in 10 minutes.`
    });

    res.status(200).json({ message: 'OTP sent to new email' });
  } catch (error) {
    console.error('Email change OTP error:', error);
    return sendError(res, 500, 'OTP_SEND_FAILED', 'Error sending OTP');
  }
});

app.post('/verify-email-change', verifyToken, async (req, res) => {
  const { otp } = req.body;
  const storedData = otpStore[`email-change-${req.user.uid}`];

  if (!storedData || storedData.expires < Date.now() || storedData.code !== otp) {
    return sendError(res, 400, 'INVALID_OTP', 'Invalid or expired OTP');
  }

  const { newEmail } = storedData;

  try {
    // 1. Update Firebase Auth
    await admin.auth().updateUser(req.user.uid, { email: newEmail });

    // 2. Update Firestore
    await db.collection('users').doc(req.user.uid).update({
      email: newEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    delete otpStore[`email-change-${req.user.uid}`];
    res.status(200).json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Verify email change error:', error);
    return sendError(res, 500, 'EMAIL_UPDATE_FAILED', 'Failed to update email');
  }
});

app.post('/update-profile', verifyToken, validateBody(schemas.updateProfile), async (req, res) => {
  const { uid, updates } = req.validatedBody;
  
  if (req.user.uid !== uid) {
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized: You can only update your own profile');
  }

  try {
    if (updates.displayName) {
        await admin.auth().updateUser(uid, { displayName: updates.displayName });
    }

    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update error:', error);
    return sendError(res, 500, 'PROFILE_UPDATE_FAILED', 'Error updating profile');
  }
});

app.post('/create-profile', verifyToken, async (req, res) => {
  const { email, displayName, photoURL } = req.body;
  const uid = req.user.uid;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        uid,
        numericUid: generateNumericUid(),
        email,
        displayName,
        username: email.split('@')[0],
        photoURL,
        totalOrders: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bio: 'I am a vibe shopper!'
      });
    }
    res.status(200).json({ message: 'Profile synced' });
  } catch (error) {
    return sendError(res, 500, 'PROFILE_SYNC_FAILED', 'Error syncing profile');
  }
});

app.get('/get-cart/:uid', verifyToken, async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
  }
  try {
    const cartDoc = await db.collection('carts').doc(req.params.uid).get();
    if (!cartDoc.exists) return res.status(200).json([]);
    res.status(200).json(cartDoc.data().items || []);
  } catch (error) {
    return sendError(res, 500, 'CART_FETCH_FAILED', 'Error fetching cart');
  }
});

app.post('/update-cart', verifyToken, async (req, res) => {
  const { uid, items } = req.body;
  if (req.user.uid !== uid) {
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
  }
  try {
    await db.collection('carts').doc(uid).set({
      uid,
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.status(200).json({ message: 'Cart updated' });
  } catch (error) {
    return sendError(res, 500, 'CART_UPDATE_FAILED', 'Error updating cart');
  }
});

app.post('/place-order', verifyToken, validateBody(schemas.order), async (req, res) => {
  try {
    const { items, address, paymentMethod } = req.validatedBody;
    const result = await finalizeOrder(req.user.uid, items, address, paymentMethod);
    res.status(200).json({ message: 'Order placed successfully', ...result });
  } catch (error) {
    console.error('Order error:', error);
    return sendError(res, 400, 'ORDER_FAILED', error.message || 'Failed to place order');
  }
});

app.get('/get-orders/:uid', verifyToken, async (req, res) => {
  if (req.user.uid !== req.params.uid && req.user.admin !== true) {
    return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
  }
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('uid', '==', req.params.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    ordersSnapshot.forEach(doc => orders.push(doc.data()));
    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return sendError(res, 500, 'ORDERS_FETCH_FAILED', 'Error fetching orders');
  }
});

app.get('/get-order/:orderId', verifyToken, async (req, res) => {
  try {
    const orderDoc = await db.collection('orders').doc(req.params.orderId).get();
    if (!orderDoc.exists) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    
    const orderData = orderDoc.data();
    // Only allow owner or admin
    if (orderData.uid !== req.user.uid && req.user.admin !== true) {
      return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
    }
    
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Fetch order error:', error);
    return sendError(res, 500, 'ORDER_FETCH_FAILED', 'Error fetching order');
  }
});

app.get('/admin/all-orders', verifyToken, isAdmin, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    ordersSnapshot.forEach(doc => orders.push(doc.data()));
    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch all orders error:', error);
    return sendError(res, 500, 'FETCH_ORDERS_FAILED', 'Error fetching all orders');
  }
});

app.get('/admin/all-users', verifyToken, isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => users.push(doc.data()));
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch all users error:', error);
    return sendError(res, 500, 'FETCH_USERS_FAILED', 'Error fetching all users');
  }
});

app.get('/admin/analytics', verifyToken, isAdmin, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const productsSnapshot = await db.collection('products').get();
    const usersSnapshot = await db.collection('users').get();

    const allOrders = [];
    ordersSnapshot.forEach(doc => allOrders.push(doc.data()));

    // Filter for delivered orders ONLY for revenue calculations
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = allOrders.length;
    const totalProducts = productsSnapshot.size;
    const totalUsers = usersSnapshot.size;

    // Recent Activity (last 5 orders - including all statuses for visibility)
    const recentActivity = allOrders.slice(0, 5).map(o => ({
      id: o.orderId,
      type: 'order',
      title: `New order #${o.orderId.slice(-6).toUpperCase()}`,
      subtitle: `$${o.total.toFixed(2)} by user ${o.uid.slice(0, 8)}`,
      timestamp: o.createdAt ? o.createdAt._seconds * 1000 : Date.now()
    }));

    // Last 7 days sales for chart (Delivered only)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesOverTime = last7Days.map(date => {
      const dayOrders = deliveredOrders.filter(o => {
        if (!o.createdAt) return false;
        const oDate = new Date(o.createdAt._seconds * 1000).toISOString().split('T')[0];
        return oDate === date;
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return { date, sales: dayRevenue, orders: dayOrders.length };
    });

    // Calculate growth (This month vs Last month) - Delivered only for revenue
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthDelivered = deliveredOrders.filter(o => o.createdAt && new Date(o.createdAt._seconds * 1000) >= thisMonthStart);
    const lastMonthDelivered = deliveredOrders.filter(o => o.createdAt && new Date(o.createdAt._seconds * 1000) >= lastMonthStart && new Date(o.createdAt._seconds * 1000) <= lastMonthEnd);

    const thisMonthRev = thisMonthDelivered.reduce((sum, o) => sum + (o.total || 0), 0);
    const lastMonthRev = lastMonthDelivered.reduce((sum, o) => sum + (o.total || 0), 0);

    // For orders growth, we might still want to count all confirmed orders vs last month, 
    // but the prompt says "Update dashboard analytics... to use only valid completed revenue data".
    // I will use allOrders for order count growth as it represents business volume, 
    // but revenue growth is strictly delivered.
    const thisMonthAllOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt._seconds * 1000) >= thisMonthStart);
    const lastMonthAllOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt._seconds * 1000) >= lastMonthStart && new Date(o.createdAt._seconds * 1000) <= lastMonthEnd);

    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return null;
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    res.status(200).send({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts,
      totalUsers,
      salesOverTime,
      recentActivity,
      trends: {
        revenue: calculateGrowth(thisMonthRev, lastMonthRev),
        orders: calculateGrowth(thisMonthAllOrders.length, lastMonthAllOrders.length),
        users: null
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return sendError(res, 500, 'FETCH_ANALYTICS_FAILED', 'Error fetching analytics');
  }
});

app.get('/admin/coupons', verifyToken, isAdmin, async (req, res) => {
  try {
    const couponsSnapshot = await db.collection('coupons').get();
    const coupons = [];
    couponsSnapshot.forEach(doc => coupons.push(doc.data()));
    res.status(200).json(coupons);
  } catch (error) {
    return sendError(res, 500, 'FETCH_COUPONS_FAILED', 'Error fetching coupons');
  }
});

app.post('/admin/add-coupon', verifyToken, isAdmin, validateBody(schemas.coupon), async (req, res) => {
  const { code, discount, type, expiryDate } = req.validatedBody;

  try {
    const couponRef = db.collection('coupons').doc(code.toUpperCase());
    await couponRef.set({
      code: code.toUpperCase(),
      discount: parseFloat(discount),
      type: type || 'percentage', // percentage or fixed
      expiryDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: 'Coupon added' });
  } catch (error) {
    return sendError(res, 500, 'ADD_COUPON_FAILED', 'Error adding coupon');
  }
});

app.delete('/admin/delete-coupon/:code', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.collection('coupons').doc(req.params.code).delete();
    res.status(200).json({ message: 'Coupon deleted' });
  } catch (error) {
    return sendError(res, 500, 'DELETE_COUPON_FAILED', 'Error deleting coupon');
  }
});

const sendPushNotification = async (uid, title, body) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token found for user ${uid}`);
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      token: fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

app.post('/update-order-status', verifyToken, async (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId) return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order ID is required');

  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    const orderData = orderDoc.data();
    
    if (orderData.uid !== req.user.uid && req.user.admin !== true) {
      return sendError(res, 403, 'FORBIDDEN', 'Unauthorized');
    }

    await orderRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    await sendPushNotification(
      orderData.uid, 
      'Order Update', 
      `Your order #${orderId.slice(-8).toUpperCase()} status is now: ${capitalizedStatus}`
    );

    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Update order error:', error);
    return sendError(res, 500, 'ORDER_UPDATE_FAILED', 'Failed to update order status');
  }
});

const generateKeywords = (name) => {
  const words = name.toLowerCase().split(/\s+/);
  const keywords = [];
  words.forEach(word => {
    let current = '';
    for (const char of word) {
      current += char;
      keywords.push(current);
    }
  });
  return [...new Set(keywords)];
};

app.get('/get-products', async (req, res) => {
  const { category, search, lastId, limit = 8 } = req.query;
  const batchLimit = Math.min(parseInt(limit), 100);

  try {
    let query = db.collection('products');
    
    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }

    if (search) {
      query = query.where('searchKeywords', 'array-contains', search.toLowerCase());
    }

    query = query.orderBy('createdAt', 'desc');

    if (lastId) {
      const lastDoc = await db.collection('products').doc(lastId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const productsSnapshot = await query.limit(batchLimit).get();
    
    let products = [];
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.id) data.id = doc.id;
      products.push(data);
    });

    const lastVisible = products.length > 0 ? products[products.length - 1].id : null;
    const hasMore = products.length === batchLimit;

    res.status(200).json({ 
      products, 
      lastId: lastVisible,
      hasMore 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return sendError(res, 500, 'PRODUCT_FETCH_FAILED', 'Error fetching products', error.message);
  }
});

app.get('/get-product/:id', async (req, res) => {
  try {
    const productDoc = await db.collection('products').doc(req.params.id).get();
    if (!productDoc.exists) return sendError(res, 404, 'NOT_FOUND', 'Product not found');
    res.status(200).json(productDoc.data());
  } catch (error) {
    console.error('Error fetching product:', error);
    return sendError(res, 500, 'FETCH_PRODUCT_FAILED', 'Error fetching product');
  }
});

app.post('/add-product', verifyToken, isAdmin, validateBody(schemas.product), async (req, res) => {
  const { name, price, description, category, image, stock } = req.validatedBody;

  try {
    const productRef = db.collection('products').doc();
    const productData = {
      id: productRef.id,
      name: name.trim(),
      price,
      description: description || '',
      category,
      stock,
      image,
      searchKeywords: generateKeywords(name.trim()),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await productRef.set(productData);
    res.status(200).json(productData);
  } catch (error) {
    return sendError(res, 500, 'PRODUCT_ADD_FAILED', 'Error adding product');
  }
});

app.post('/update-product/:id', verifyToken, isAdmin, validateBody(schemas.product.partial()), async (req, res) => {
  try {
    const productRef = db.collection('products').doc(req.params.id);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Product not found');
    }

    const updates = {
      ...req.validatedBody,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updates.name) {
      updates.searchKeywords = generateKeywords(updates.name.trim());
      updates.name = updates.name.trim();
    }

    await productRef.update(updates);
    res.status(200).json({ id: req.params.id, ...updates });
  } catch (error) {
    console.error('Update product error:', error);
    return sendError(res, 500, 'PRODUCT_UPDATE_FAILED', 'Error updating product');
  }
});

app.delete('/delete-product/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.collection('products').doc(req.params.id).delete();
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    return sendError(res, 500, 'PRODUCT_DELETE_FAILED', 'Error deleting product');
  }
});

app.post('/admin/send-promotion', verifyToken, isAdmin, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return sendError(res, 400, 'INVALID_INPUT', 'Title and body are required');

  try {
    const usersSnapshot = await db.collection('users').get();
    const tokens = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) tokens.push(data.fcmToken);
    });

    if (tokens.length === 0) return res.status(200).json({ message: 'No users with FCM tokens found' });

    const message = {
      notification: { title, body },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    res.status(200).json({ 
      message: `Sent to ${response.successCount} users`,
      failureCount: response.failureCount 
    });
  } catch (error) {
    console.error('Promotion error:', error);
    return sendError(res, 500, 'PROMOTION_FAILED', 'Failed to send promotions');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
