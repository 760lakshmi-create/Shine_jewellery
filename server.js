import 'dotenv/config';
import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.API_PORT) || 5000;
// Support both names used by common MongoDB hosting guides and older local setups.
const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
function normalizeOrigin(value) {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

const frontendOrigins = new Set(
  [
    // Production storefront domain; FRONTEND_URL can add staging/preview domains.
    'https://shine-jewellery-beta.vercel.app',
    ...(process.env.FRONTEND_URL || '').split(','),
  ]
    .map(normalizeOrigin)
    .filter(Boolean),
);

app.use((request, response, next) => {
  const origin = request.get('Origin');
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const isLocalFrontend = normalizedOrigin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin);

  response.vary('Origin');
  if (normalizedOrigin && (isLocalFrontend || frontendOrigins.has(normalizedOrigin))) {
    response.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.setHeader('Access-Control-Max-Age', '86400');
  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }
  return next();
});

app.use(express.json({ limit: '4mb' }));

const orderSchema = new mongoose.Schema(
  {
    customer: {
      email: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    items: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
      
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'fulfilled', 'completed', 'cancelled'], default: 'pending' },
    statusHistory: [{ status: { type: String, enum: ['pending', 'accepted', 'rejected', 'fulfilled', 'completed', 'cancelled'], required: true }, changedAt: { type: Date, default: Date.now }, note: { type: String, default: '' } }],
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    trackingStatus: { type: String, default: 'not_shipped', trim: true },
    trackingEvents: [{ status: { type: String, required: true }, note: { type: String, default: '' }, occurredAt: { type: Date, default: Date.now } }],
    estimatedDeliveryAt: Date,
    courierName: { type: String, default: '', trim: true },
    trackingNo: { type: String, default: '', trim: true },
    deliveredAt: Date,
    cancelReason: { type: String, default: '' },
    refundRequestedAt: Date,
    returnStatus: { type: String, enum: ['none', 'requested', 'accepted', 'rejected', 'pickup_scheduled', 'picked_up', 'completed'], default: 'none' },
    returnReason: { type: String, default: '' },
    returnRequestedAt: Date,
    returnPickupDate: Date,
    returnResolvedAt: Date,
    disputeHistory: [{ type: { type: String, required: true }, reason: { type: String, default: '' }, status: { type: String, default: '' }, actor: { type: String, default: '' }, createdAt: { type: Date, default: Date.now } }],
    paymentLogs: [{ provider: { type: String, default: 'Razorpay' }, orderReference: { type: String, default: '' }, paymentReference: { type: String, default: '' }, amount: { type: Number, min: 0, default: 0 }, status: { type: String, default: 'pending' }, createdAt: { type: Date, default: Date.now } }],
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    deliveryStatus: { type: String, default: '' },
  },
  { timestamps: true },
);

const Order = mongoose.model('Order', orderSchema);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

const customerTokenSecret = process.env.CUSTOMER_TOKEN_SECRET || process.env.DELIVERY_TOKEN_SECRET || process.env.ADMIN_API_KEY;
function createCustomerToken(user) {
  if (!customerTokenSecret) throw new Error('Set CUSTOMER_TOKEN_SECRET in .env to enable customer order history.');
  const payload = Buffer.from(JSON.stringify({ id: user._id.toString(), role: 'customer', exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString('base64url');
  const signature = crypto.createHmac('sha256', customerTokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function requireCustomer(request, response, next) {
  try {
    const [payload, signature] = (request.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!payload || !signature || !customerTokenSecret) return response.status(401).json({ ok: false, message: 'Please sign in to view your orders.' });
    const expected = crypto.createHmac('sha256', customerTokenSecret).update(payload).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return response.status(401).json({ ok: false, message: 'Invalid customer session. Please sign in again.' });
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (claims.role !== 'customer' || claims.exp < Date.now()) return response.status(401).json({ ok: false, message: 'Your customer session expired. Please sign in again.' });
    request.customer = await User.findById(claims.id).select('-passwordHash');
    if (!request.customer) return response.status(401).json({ ok: false, message: 'Customer account not found. Please sign in again.' });
    return next();
  } catch { return response.status(401).json({ ok: false, message: 'Invalid customer session. Please sign in again.' }); }
}

const productSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    active: { type: Boolean, default: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    largeImage: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    details: [String],
  },
  { timestamps: true },
);

const Product = mongoose.model('Product', productSchema);

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '', trim: true },
  personalDetails: { address: { type: String, default: '' }, city: { type: String, default: '' }, postalCode: { type: String, default: '' }, country: { type: String, default: 'India' } },
  storeName: { type: String, default: '' },
  businessDetails: { legalName: { type: String, default: '' }, gstin: { type: String, default: '' }, pan: { type: String, default: '' }, verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' } },
  catalog: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  inventory: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, sku: { type: String, default: '' }, quantity: { type: Number, min: 0, default: 0 }, updatedAt: { type: Date, default: Date.now } }],
  orderHistory: [{ order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, status: { type: String, enum: ['pending', 'accepted', 'rejected', 'fulfilled', 'completed', 'cancelled'], default: 'pending' }, total: { type: Number, min: 0, default: 0 }, statusHistory: [{ status: String, changedAt: { type: Date, default: Date.now }, note: String }] }],
  operationalStatus: { type: String, enum: ['active', 'paused', 'suspended'], default: 'active' },
  totalActiveListings: { type: Number, min: 0, default: 0 },
  realTimeStockLevels: { type: Number, min: 0, default: 0 },
  cumulativeProductsSold: { type: Number, min: 0, default: 0 },
  totalGeneratedRevenue: { type: Number, min: 0, default: 0 },
  paymentSummary: { currency: { type: String, default: 'INR' }, totalSales: { type: Number, min: 0, default: 0 }, payouts: { type: Number, min: 0, default: 0 }, pendingSettlements: { type: Number, min: 0, default: 0 }, pendingAmount: { type: Number, min: 0, default: 0 }, paidAmount: { type: Number, min: 0, default: 0 }, refundedAmount: { type: Number, min: 0, default: 0 }, lastPayoutAt: Date, transactions: [{ type: { type: String, enum: ['sale', 'payout', 'refund'], required: true }, order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, reference: { type: String, default: '' }, amount: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }, createdAt: { type: Date, default: Date.now } }] },
  settings: { emailNotifications: { type: Boolean, default: true }, orderNotifications: { type: Boolean, default: true } },
  supportRequests: [{ subject: { type: String, required: true }, message: { type: String, required: true }, createdAt: { type: Date, default: Date.now }, status: { type: String, default: 'open' } }],
}, { timestamps: true });
const Seller = mongoose.model('Seller', sellerSchema);

async function createSellerOwnedOrder(orderData, paymentStatus = 'paid', paymentInfo = {}) {
  const customer = orderData?.customer || {};
  const items = Array.isArray(orderData?.items) ? orderData.items : [];
  const total = Number(orderData?.total);
  if (!customer.email?.trim() || !customer.firstName?.trim() || !customer.lastName?.trim() || !customer.address?.trim() || !customer.city?.trim() || !customer.postalCode?.trim()) {
    throw new Error('Please fill in all required delivery and contact details.');
  }
  if (!items.length || items.some((item) => !item?.id || !item?.name || !Number.isFinite(Number(item.price)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    throw new Error('Your cart contains an invalid item. Remove it and add the product again.');
  }
  if (!Number.isFinite(total) || total <= 0) throw new Error('A valid order total is required.');
  const normalizedItems = items.map((item) => ({ ...item, image: item.image || '', price: Number(item.price), quantity: Number(item.quantity) }));
  const itemIds = normalizedItems.map((item) => String(item.id));
  const ownerIds = await Product.find({ $or: [{ _id: { $in: itemIds.filter((id) => mongoose.isValidObjectId(id)) } }, { id: { $in: itemIds } }] }).distinct('seller');
  const sellerIds = [...new Set(ownerIds.filter(Boolean).map(String))];
  const sellerId = sellerIds.length === 1 ? sellerIds[0] : undefined;
  const status = 'pending';
  const now = new Date();
  const order = await Order.create({
    ...orderData,
    customer,
    items: normalizedItems,
    total,
    status,
    paymentStatus,
    trackingStatus: 'order_placed',
    estimatedDeliveryAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    ...(sellerId ? { seller: sellerId } : {}),
    statusHistory: [{ status, changedAt: now, note: 'Order placed by customer.' }],
    trackingEvents: [{ status: 'order_placed', note: 'Order confirmed. Seller is preparing your items.', occurredAt: now }],
    paymentLogs: [{ provider: 'Razorpay', orderReference: paymentInfo.orderId || '', paymentReference: paymentInfo.paymentId || '', amount: orderData.total, status: paymentStatus, createdAt: now }],
  });
  if (sellerId) {
    await Seller.updateOne({ _id: sellerId }, {
      $push: {
        orderHistory: { order: order._id, status, total: order.total, statusHistory: [{ status, note: 'Order placed by customer.' }] },
        'paymentSummary.transactions': { type: 'sale', order: order._id, amount: order.total, status: paymentStatus === 'paid' ? 'paid' : 'pending' },
      },
    });
    await refreshSellerMetrics(sellerId);
  }
  return order;
}

const sellerTokenSecret = process.env.SELLER_TOKEN_SECRET || process.env.DELIVERY_TOKEN_SECRET || process.env.ADMIN_API_KEY;
function createSellerToken(seller) {
  if (!sellerTokenSecret) throw new Error('Set SELLER_TOKEN_SECRET in .env before enabling seller accounts.');
  const payload = Buffer.from(JSON.stringify({ id: seller._id.toString(), role: 'seller', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const signature = crypto.createHmac('sha256', sellerTokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
async function requireSeller(request, response, next) {
  try {
    const [payload, signature] = (request.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!payload || !signature || !sellerTokenSecret) return response.status(401).json({ ok: false, message: 'Please sign in again.' });
    const expected = crypto.createHmac('sha256', sellerTokenSecret).update(payload).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return response.status(401).json({ ok: false, message: 'Invalid session.' });
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (claims.role !== 'seller' || claims.exp < Date.now()) return response.status(401).json({ ok: false, message: 'Session expired.' });
    request.seller = await Seller.findById(claims.id).select('-passwordHash');
    if (!request.seller) return response.status(401).json({ ok: false, message: 'Seller account not found.' });
    return next();
  } catch { return response.status(401).json({ ok: false, message: 'Invalid session.' }); }
}

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Collection = mongoose.model('Collection', collectionSchema);

const deliveryBoySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    personalIdentification: { idType: { type: String, default: '' }, idNumber: { type: String, default: '' }, licenseNumber: { type: String, default: '' } },
    verification: { status: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' }, checkedAt: Date, notes: { type: String, default: '' } },
    address: { line1: { type: String, default: '' }, city: { type: String, default: '' }, postalCode: { type: String, default: '' } },
    location: { city: { type: String, default: '' }, postalCode: { type: String, default: '' }, coordinates: { type: [Number], default: [] } },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    operationalStatus: { type: String, enum: ['available', 'offline', 'on_delivery'], default: 'available' },
    activeAssignmentsCount: { type: Number, min: 0, default: 0 },
    totalSuccessfulDeliveries: { type: Number, min: 0, default: 0 },
    failedAttempts: { type: Number, min: 0, default: 0 },
    acceptanceRate: { type: Number, min: 0, max: 100, default: 0 },
    rejectionRate: { type: Number, min: 0, max: 100, default: 0 },
    assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    deliveryHistory: [{ order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, status: { type: String, enum: ['delivered', 'rejected'], required: true }, completedAt: { type: Date, default: Date.now } }],
    payoutRecords: [{ order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, amount: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['pending', 'paid'], default: 'pending' }, paidAt: Date }],
  },
  { timestamps: true },
);
const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy', required: true },
    decision: { type: String, enum: ['offered', 'accepted', 'rejected'], default: 'offered' },
    status: { type: String, enum: ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'customer_rejected'], default: 'assigned' },
    payoutAmount: { type: Number, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    deliveredAt: Date,
    pickupDate: Date,
    pickupConfirmedAt: Date,
  },
  { timestamps: true },
);
const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);

async function refreshSellerMetrics(sellerId) {
  const [products, orders] = await Promise.all([
    Product.find({ seller: sellerId, active: { $ne: false } }).select('stock'),
    Order.find({ seller: sellerId }).select('status total items paymentStatus createdAt'),
  ]);
  const totalGeneratedRevenue = orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0);
  const cumulativeProductsSold = orders.filter((order) => !['cancelled', 'rejected'].includes(order.status)).reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0);
  const fulfilled = orders.filter((order) => ['fulfilled', 'completed'].includes(order.status));
  const settledSales = fulfilled.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0);
  const payoutTotal = Number((await Seller.findById(sellerId).select('paymentSummary.payouts'))?.paymentSummary?.payouts || 0);
  const pendingSettlements = Math.max(0, settledSales - payoutTotal);
  await Seller.updateOne({ _id: sellerId }, { $set: {
    totalActiveListings: products.length,
    realTimeStockLevels: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
    cumulativeProductsSold,
    totalGeneratedRevenue,
    'paymentSummary.totalSales': totalGeneratedRevenue,
    'paymentSummary.pendingSettlements': pendingSettlements,
    'paymentSummary.pendingAmount': pendingSettlements,
    'paymentSummary.paidAmount': payoutTotal,
  } });
}

async function refreshDeliveryMetrics(deliveryBoyId) {
  const assignments = await DeliveryAssignment.find({ deliveryBoy: deliveryBoyId }).select('decision status');
  const decided = assignments.filter((assignment) => ['accepted', 'rejected'].includes(assignment.decision));
  const accepted = decided.filter((assignment) => assignment.decision === 'accepted').length;
  const rejected = decided.filter((assignment) => assignment.decision === 'rejected').length;
  const successful = assignments.filter((assignment) => assignment.status === 'delivered').length;
  await DeliveryBoy.updateOne({ _id: deliveryBoyId }, { $set: {
    activeAssignmentsCount: assignments.filter((assignment) => ['offered', 'accepted'].includes(assignment.decision) && !['delivered', 'customer_rejected'].includes(assignment.status)).length,
    totalSuccessfulDeliveries: successful,
    failedAttempts: rejected,
    acceptanceRate: decided.length ? Math.round(accepted * 100 / decided.length) : 0,
    rejectionRate: decided.length ? Math.round(rejected * 100 / decided.length) : 0,
  } });
}

const deliveryTokenSecret = process.env.DELIVERY_TOKEN_SECRET || process.env.ADMIN_API_KEY;
function createDeliveryToken(deliveryBoy) {
  if (!deliveryTokenSecret) throw new Error('Set DELIVERY_TOKEN_SECRET in .env before enabling delivery logins.');
  const payload = Buffer.from(JSON.stringify({ id: deliveryBoy._id.toString(), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const signature = crypto.createHmac('sha256', deliveryTokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
async function requireDeliveryBoy(request, response, next) {
  try {
    const [payload, signature] = (request.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!payload || !signature || !deliveryTokenSecret) return response.status(401).json({ ok: false, message: 'Please sign in again.' });
    const expected = crypto.createHmac('sha256', deliveryTokenSecret).update(payload).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return response.status(401).json({ ok: false, message: 'Invalid session.' });
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (claims.exp < Date.now()) return response.status(401).json({ ok: false, message: 'Session expired.' });
    request.deliveryBoy = await DeliveryBoy.findOne({ _id: claims.id, active: true });
    if (!request.deliveryBoy) return response.status(401).json({ ok: false, message: 'Delivery account is inactive.' });
    return next();
  } catch {
    return response.status(401).json({ ok: false, message: 'Invalid session.' });
  }
}
function requireAdminApiKey(request, response) {
  const key = process.env.ADMIN_API_KEY;
  if (key && request.get('x-admin-key') === key) return true;
  try {
    const [payload, signature] = (request.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!payload || !signature || !deliveryTokenSecret) throw new Error('Missing token');
    const expected = crypto.createHmac('sha256', deliveryTokenSecret).update(payload).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) throw new Error('Invalid signature');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (claims.role === 'admin' && claims.exp > Date.now()) return true;
  } catch { /* invalid or expired token */ }
  response.status(401).json({ ok: false, message: 'Unauthorized.' });
  return false;
}

function createAdminToken(email) {
  if (!deliveryTokenSecret) throw new Error('Set DELIVERY_TOKEN_SECRET in .env before admin sign in.');
  const payload = Buffer.from(JSON.stringify({ email, role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url');
  const signature = crypto.createHmac('sha256', deliveryTokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

app.get('/', (_request, response) => {
  response.json({ ok: true, message: 'Shine Jewelry API is running' });
});

app.get('/api/health', (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    ok: connected,
    database: connected ? 'connected' : 'disconnected',
  });
});

app.post('/api/seller/signup', async (request, response) => {
  try {
    const { name, email, password, storeName = '' } = request.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || !password || password.length < 8) return response.status(400).json({ ok: false, message: 'Name, email and a password of at least 8 characters are required.' });
    const seller = await Seller.create({ name: name.trim(), email: normalizedEmail, phone: (request.body.phone || '').trim(), storeName: storeName.trim(), passwordHash: await bcrypt.hash(password, 12) });
    return response.status(201).json({ ok: true, token: createSellerToken(seller), seller: { id: seller._id, name: seller.name, email: seller.email, phone: seller.phone, storeName: seller.storeName } });
  } catch (error) { return response.status(error.code === 11000 ? 409 : 400).json({ ok: false, message: error.code === 11000 ? 'An account with this email already exists.' : error.message }); }
});

app.post('/api/seller/login', async (request, response) => {
  try {
    const seller = await Seller.findOne({ email: request.body.email?.trim().toLowerCase() });
    if (!seller || !await bcrypt.compare(request.body.password || '', seller.passwordHash)) return response.status(401).json({ ok: false, message: 'Invalid email or password.' });
    return response.json({ ok: true, token: createSellerToken(seller), seller: { id: seller._id, name: seller.name, email: seller.email, phone: seller.phone, storeName: seller.storeName } });
  } catch (error) { return response.status(503).json({ ok: false, message: error.message }); }
});

app.get('/api/seller/me', requireSeller, (request, response) => response.json({ seller: request.seller }));
app.get('/api/seller/payments', requireSeller, (request, response) => response.json(request.seller.paymentSummary || { currency: 'INR', totalSales: 0, pendingAmount: 0, paidAmount: 0, refundedAmount: 0 }));
app.patch('/api/seller/profile', requireSeller, async (request, response) => {
  const updates = {};
  for (const field of ['name', 'phone', 'storeName']) if (typeof request.body[field] === 'string') updates[field] = request.body[field].trim();
  for (const field of ['personalDetails', 'businessDetails']) if (request.body[field] && typeof request.body[field] === 'object') updates[field] = request.body[field];
  try {
    const seller = await Seller.findByIdAndUpdate(request.seller._id, { $set: updates }, { new: true, runValidators: true }).select('-passwordHash');
    return response.json({ seller });
  } catch (error) { return response.status(400).json({ message: error.message }); }
});
app.patch('/api/seller/settings', requireSeller, async (request, response) => {
  const updates = {};
  if (typeof request.body.storeName === 'string') updates.storeName = request.body.storeName.trim();
  if (request.body.settings && typeof request.body.settings === 'object') updates.settings = request.body.settings;
  const seller = await Seller.findByIdAndUpdate(request.seller._id, { $set: updates }, { new: true, runValidators: true }).select('-passwordHash');
  return response.json({ seller });
});
app.post('/api/seller/support', requireSeller, async (request, response) => {
  const { subject, message } = request.body;
  if (!subject?.trim() || !message?.trim()) return response.status(400).json({ message: 'A subject and message are required.' });
  const seller = await Seller.findByIdAndUpdate(request.seller._id, { $push: { supportRequests: { subject: subject.trim(), message: message.trim() } } }, { new: true }).select('-passwordHash');
  return response.status(201).json({ ok: true, supportRequests: seller.supportRequests });
});

app.get('/api/seller/products', requireSeller, async (request, response) => response.json(await Product.find({ seller: request.seller._id }).sort({ createdAt: -1 })));
app.post('/api/seller/products', requireSeller, async (request, response) => {
  try {
    const product = await Product.create({ ...request.body, seller: request.seller._id });
    await Seller.findByIdAndUpdate(request.seller._id, { $addToSet: { catalog: product._id }, $push: { inventory: { product: product._id, sku: product.id || '', quantity: product.stock } } });
    await refreshSellerMetrics(request.seller._id);
    return response.status(201).json(product);
  }
  catch (error) { return response.status(400).json({ message: error.message }); }
});
app.put('/api/seller/products/:id', requireSeller, async (request, response) => {
  try {
    const allowed = ['name', 'category', 'price', 'stock', 'description', 'image', 'largeImage', 'details'];
    const updates = Object.fromEntries(allowed.filter((field) => request.body[field] !== undefined).map((field) => [field, request.body[field]]));
    const product = await Product.findOneAndUpdate({ _id: request.params.id, seller: request.seller._id }, { $set: updates }, { new: true, runValidators: true });
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    await Seller.updateOne({ _id: request.seller._id, 'inventory.product': product._id }, { $set: { 'inventory.$.quantity': product.stock, 'inventory.$.updatedAt': new Date() } });
    await refreshSellerMetrics(request.seller._id);
    return response.json(product);
  } catch (error) { return response.status(400).json({ message: error.message }); }
});
app.delete('/api/seller/products/:id', requireSeller, async (request, response) => {
  const product = await Product.findOneAndDelete({ _id: request.params.id, seller: request.seller._id });
  if (!product) return response.status(404).json({ message: 'Product not found.' });
  await Seller.findByIdAndUpdate(request.seller._id, { $pull: { catalog: product._id, inventory: { product: product._id } } });
  await refreshSellerMetrics(request.seller._id);
  return response.json({ ok: true });
});

app.get('/api/seller/orders', requireSeller, async (request, response) => {
  const products = await Product.find({ seller: request.seller._id }).select('id _id');
  const productIds = new Set(products.flatMap((product) => [String(product._id), product.id].filter(Boolean)));
  const orders = await Order.find({ $or: [{ seller: request.seller._id }, { 'items.id': { $in: [...productIds] } }] }).sort({ createdAt: -1 });
  return response.json(orders.map((order) => ({
    id: order._id, customer: `${order.customer.firstName} ${order.customer.lastName}`,
    items: order.items.map((item) => `${item.name} · ${item.quantity}`).join(', '), total: order.total,
    status: ['completed', 'fulfilled'].includes(order.status) ? 'Completed' : order.status === 'pending' ? 'New' : order.status === 'rejected' ? 'Rejected' : order.status === 'cancelled' ? 'Cancelled' : 'Processing',
    delivery: order.deliveryStatus || undefined, trackingStatus: order.trackingStatus, returnStatus: order.returnStatus,
    returnReason: order.returnReason, returnPickupDate: order.returnPickupDate, cancelReason: order.cancelReason, date: order.createdAt,
  })));
});

app.patch('/api/seller/orders/:id/status', requireSeller, async (request, response) => {
  const status = request.body?.status;
  if (!['accepted', 'rejected', 'fulfilled', 'completed', 'cancelled'].includes(status)) return response.status(400).json({ message: 'Unsupported order status.' });
  try {
    const order = await Order.findOne({ _id: request.params.id, seller: request.seller._id });
    if (!order) return response.status(404).json({ message: 'Order not found for this seller.' });
    if (['fulfilled', 'completed'].includes(status) && order.trackingStatus !== 'delivered') return response.status(409).json({ message: 'An order can only be completed after the customer confirms delivery.' });
    const previousStatus = order.status || 'pending';
    order.status = status;
    order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    order.statusHistory.push({ status, note: 'Seller updated order status.' });
    await order.save();
    await Seller.updateOne({ _id: request.seller._id, 'orderHistory.order': order._id }, { $set: { 'orderHistory.$.status': status }, $push: { 'orderHistory.$.statusHistory': { status, note: 'Seller updated order status.' } } });
    if (status === 'fulfilled' && !['fulfilled', 'completed'].includes(previousStatus)) await Seller.updateOne({ _id: request.seller._id }, { $inc: { 'paymentSummary.pendingAmount': -order.total, 'paymentSummary.paidAmount': order.total } });
    await refreshSellerMetrics(request.seller._id);
    return response.json({ ok: true, order });
  } catch (error) { return response.status(400).json({ message: error.message || 'Could not update order status.' }); }
});

app.get('/api/seller/delivery-riders', requireSeller, async (_request, response) => {
  const busyIds = await DeliveryAssignment.distinct('deliveryBoy', { decision: { $in: ['offered', 'accepted'] }, status: { $nin: ['delivered', 'customer_rejected'] } });
  const available = await DeliveryBoy.find({ active: true, _id: { $nin: busyIds } }).select('_id name email').sort({ createdAt: 1 });
  return response.json(available);
});

app.post('/api/seller/orders/:id/assign-delivery', requireSeller, async (request, response) => {
  try {
    const order = await Order.findOne({ _id: request.params.id, seller: request.seller._id });
    if (!order) return response.status(404).json({ message: 'Order not found for this seller.' });
    const existing = await DeliveryAssignment.findOne({ order: order._id, decision: { $in: ['offered', 'accepted'] } });
    if (existing) return response.status(409).json({ message: 'A delivery request is already active for this order.' });
    const busyIds = await DeliveryAssignment.distinct('deliveryBoy', { decision: { $in: ['offered', 'accepted'] }, status: { $nin: ['delivered', 'customer_rejected'] } });
    const rider = await DeliveryBoy.findOne({ active: true, operationalStatus: { $ne: 'offline' }, _id: { $nin: busyIds }, $or: [{ 'location.city': new RegExp(`^${order.customer.city}$`, 'i') }, { 'address.city': new RegExp(`^${order.customer.city}$`, 'i') }] }).sort({ createdAt: 1 })
      || await DeliveryBoy.findOne({ active: true, operationalStatus: { $ne: 'offline' }, _id: { $nin: busyIds } }).sort({ createdAt: 1 });
    if (!rider) return response.status(409).json({ message: 'No nearby delivery partner is available right now.' });
    const assignment = await DeliveryAssignment.create({ order: order._id, deliveryBoy: rider._id });
    order.deliveryBoy = rider._id; order.deliveryStatus = 'Requested'; order.status = 'accepted'; order.statusHistory.push({ status: 'accepted', note: 'Seller requested delivery pickup.' }); await order.save();
    await Promise.all([
      DeliveryBoy.findByIdAndUpdate(rider._id, { $addToSet: { assignedOrders: order._id }, $set: { operationalStatus: 'on_delivery' }, $push: { payoutRecords: { order: order._id, amount: 0, status: 'pending' } } }),
      Seller.updateOne({ _id: request.seller._id, 'orderHistory.order': order._id }, { $set: { 'orderHistory.$.status': 'accepted' }, $push: { 'orderHistory.$.statusHistory': { status: 'accepted', note: 'Seller requested delivery pickup.' } } }),
    ]);
    await refreshDeliveryMetrics(rider._id);
    return response.status(201).json({ ok: true, assignment, rider: { name: rider.name } });
  } catch (error) { return response.status(400).json({ message: error.message }); }
});

app.patch('/api/seller/orders/:id/pickup', requireSeller, async (request, response) => {
  const { pickupDate, pickupTime } = request.body;
  if (!pickupDate || !pickupTime) return response.status(400).json({ message: 'Pickup date and time are required.' });
  try {
    const order = await Order.findOne({ _id: request.params.id, seller: request.seller._id });
    if (!order) return response.status(404).json({ message: 'Order not found for this seller.' });
    const assignment = await DeliveryAssignment.findOne({ order: order._id, decision: 'accepted' });
    if (!assignment) return response.status(409).json({ message: 'The delivery partner has not accepted this request.' });
    assignment.pickupDate = new Date(`${pickupDate}T${pickupTime}`); assignment.pickupConfirmedAt = new Date(); await assignment.save();
    order.deliveryStatus = 'Pickup confirmed';
    order.trackingStatus = 'shipped';
    order.trackingEvents.push({ status: 'shipped', note: `Seller confirmed dispatch. Pickup scheduled for ${pickupDate} at ${pickupTime}.`, occurredAt: new Date() });
    await order.save();
    return response.json({ ok: true, assignment });
  } catch (error) { return response.status(400).json({ message: error.message }); }
});

app.patch('/api/seller/orders/:id/return', requireSeller, async (request, response) => {
  const { action } = request.body;
  if (!['accept', 'reject', 'complete'].includes(action)) return response.status(400).json({ message: 'Unsupported return action.' });
  try {
    const order = await Order.findOne({ _id: request.params.id, seller: request.seller._id });
    if (!order) return response.status(404).json({ message: 'Order not found for this seller.' });
    if (action === 'accept' || action === 'reject') {
      if (order.returnStatus !== 'requested') return response.status(409).json({ message: 'There is no return request waiting for review.' });
      order.returnStatus = action === 'accept' ? 'accepted' : 'rejected';
      order.returnResolvedAt = new Date();
      order.disputeHistory.push({ type: 'return', reason: order.returnReason, status: order.returnStatus, actor: 'seller' });
      order.trackingEvents.push({ status: `return_${order.returnStatus}`, note: action === 'accept' ? 'Seller accepted the return. Choose a pickup date in order tracking.' : 'Seller declined the return request.', occurredAt: new Date() });
    } else {
      if (order.returnStatus !== 'pickup_scheduled') return response.status(409).json({ message: 'The customer has not accepted a return pickup date.' });
      order.returnStatus = 'completed'; order.returnResolvedAt = new Date(); order.trackingStatus = 'returned';
      order.disputeHistory.push({ type: 'return', reason: order.returnReason, status: 'completed', actor: 'seller' });
      order.trackingEvents.push({ status: 'returned', note: 'Return pickup received and return completed.', occurredAt: new Date() });
      if (order.paymentStatus === 'paid') {
        order.refundRequestedAt = new Date();
        order.paymentLogs.push({ provider: 'Razorpay', amount: order.total, status: 'refund_requested' });
      }
    }
    await order.save();
    return response.json({ ok: true, returnStatus: order.returnStatus });
  } catch (error) { return response.status(400).json({ message: error.message }); }
});

async function startServer() {
  if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGODB_URI (or DATABASE_URL) in your .env file.');
  }

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed. Check MONGODB_URI and your database network access:', error.message);
  }
}

startServer().catch((error) => {
  console.error('Could not start API server:', error.message);
  process.exit(1);
});

app.post('/api/orders', async (request, response) => {
  try {
    const order = await createSellerOwnedOrder(request.body, 'pending');
    response.status(201).json({ ok: true, orderId: order._id });
  } catch (error) {
    response.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/api/payment/orders', async (request, response) => {
  try {
    if (!hasRazorpayKeys) {
      return response.status(503).json({ ok: false, message: 'Razorpay keys are missing in .env.' });
    }

    const amount = Number(request.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return response.status(400).json({ ok: false, message: 'A valid payment amount is required.' });
    }

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const gatewayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: `shine_${Date.now()}` }),
    });
    const gatewayText = await gatewayResponse.text();
    let gatewayResult;
    try { gatewayResult = gatewayText ? JSON.parse(gatewayText) : {}; }
    catch { return response.status(502).json({ ok: false, message: 'Razorpay returned an unreadable response. Please try again.' }); }
    if (!gatewayResponse.ok) {
      const gatewayMessage = gatewayResult?.error?.description || gatewayResult?.error?.reason;
      return response.status(gatewayResponse.status).json({ ok: false, message: gatewayMessage || `Razorpay could not create the payment order (HTTP ${gatewayResponse.status}).` });
    }
    return response.status(201).json({ ok: true, order: gatewayResult });
  } catch (error) {
    console.error('Razorpay order request failed:', error);
    return response.status(502).json({ ok: false, message: 'Razorpay tak request nahi pahunch saki. API server ka internet connection aur payment service ki availability check karke dobara try karein.' });
  }
});

app.post('/api/payment/verify', async (request, response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, items, total } = request.body;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return response.status(400).json({ ok: false, message: 'Payment verification failed.' });
    }

    const order = await createSellerOwnedOrder({ customer, items, total }, 'paid', { orderId: razorpay_order_id, paymentId: razorpay_payment_id });
    return response.status(201).json({ ok: true, orderId: order._id });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

async function findCustomerOrder(orderId, email) {
  if (!mongoose.isValidObjectId(orderId) || !email?.trim()) return null;
  const order = await Order.findById(orderId).populate('deliveryBoy', 'name phone');
  return order && order.customer.email.toLowerCase() === email.trim().toLowerCase() ? order : null;
}

app.get('/api/orders/:id/track', async (request, response) => {
  try {
    const order = await findCustomerOrder(request.params.id, request.query.email);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found. Check the order number and checkout email.' });
    return response.json({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      email: order.customer.email,
      items: order.items,
      total: order.total,
      paymentStatus: order.paymentStatus,
      refundRequestedAt: order.refundRequestedAt,
      status: order.status,
      trackingStatus: order.trackingStatus,
      trackingEvents: order.trackingEvents,
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      courierName: order.courierName,
      trackingNo: order.trackingNo,
      deliveryAddress: `${order.customer.address}, ${order.customer.city} ${order.customer.postalCode}`,
      deliveryPartner: order.deliveryBoy ? { name: order.deliveryBoy.name, phone: order.deliveryBoy.phone } : null,
      cancelReason: order.cancelReason,
      returnStatus: order.returnStatus,
      returnReason: order.returnReason,
      returnPickupDate: order.returnPickupDate,
      cancellationAllowed: !['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.trackingStatus),
      returnAllowed: order.trackingStatus === 'delivered' && order.returnStatus === 'none' && Date.now() - new Date(order.deliveredAt || order.updatedAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
    });
  } catch (error) { return response.status(500).json({ ok: false, message: error.message }); }
});

app.post('/api/orders/:id/delivery/decision', async (request, response) => {
  const decision = request.body?.decision;
  const email = request.body?.email;
  if (!['accepted', 'rejected'].includes(decision)) return response.status(400).json({ ok: false, message: 'Choose accept or reject for this delivery.' });
  try {
    const order = await findCustomerOrder(request.params.id, email);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found for this checkout email.' });
    if (order.trackingStatus !== 'out_for_delivery') return response.status(409).json({ ok: false, message: 'Delivery confirmation is available only while the order is out for delivery.' });
    const assignment = await DeliveryAssignment.findOne({ order: order._id, decision: 'accepted', status: 'out_for_delivery' });
    if (!assignment) return response.status(409).json({ ok: false, message: 'No active delivery partner is assigned to this order.' });

    if (decision === 'accepted') {
      assignment.status = 'delivered'; assignment.deliveredAt = new Date();
      order.trackingStatus = 'delivered'; order.status = 'fulfilled'; order.deliveredAt = new Date();
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.trackingEvents = Array.isArray(order.trackingEvents) ? order.trackingEvents : [];
      order.statusHistory.push({ status: 'fulfilled', note: 'Customer accepted the delivered order.' });
      order.trackingEvents.push({ status: 'delivered', note: 'Customer confirmed receipt of the order.', occurredAt: new Date() });
      await Promise.all([
        assignment.save(), order.save(),
        DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoy, { $pull: { assignedOrders: order._id }, $set: { operationalStatus: 'available' }, $push: { deliveryHistory: { order: order._id, status: 'delivered' } } }),
        ...(order.seller ? [Seller.updateOne({ _id: order.seller, 'orderHistory.order': order._id }, { $set: { 'orderHistory.$.status': 'fulfilled' }, $push: { 'orderHistory.$.statusHistory': { status: 'fulfilled', note: 'Customer confirmed receipt of the order.' } }, $inc: { 'paymentSummary.pendingAmount': -order.total, 'paymentSummary.paidAmount': order.total } })] : []),
      ]);
    } else {
      assignment.status = 'customer_rejected';
      order.status = 'cancelled'; order.trackingStatus = 'cancelled'; order.cancelReason = 'Customer declined the delivery.';
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.trackingEvents = Array.isArray(order.trackingEvents) ? order.trackingEvents : [];
      order.disputeHistory = Array.isArray(order.disputeHistory) ? order.disputeHistory : [];
      order.paymentLogs = Array.isArray(order.paymentLogs) ? order.paymentLogs : [];
      order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });
      order.disputeHistory.push({ type: 'delivery', reason: order.cancelReason, status: 'rejected', actor: 'customer' });
      order.trackingEvents.push({ status: 'delivery_rejected', note: 'Customer declined this delivery. The order was cancelled.', occurredAt: new Date() });
      if (order.paymentStatus === 'paid') {
        order.refundRequestedAt = new Date();
        order.paymentLogs.push({ provider: 'Razorpay', amount: order.total, status: 'refund_requested' });
      }
      await Promise.all([
        assignment.save(), order.save(),
        DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoy, { $pull: { assignedOrders: order._id }, $set: { operationalStatus: 'available' }, $push: { deliveryHistory: { order: order._id, status: 'rejected' } } }),
        ...(order.seller ? [Seller.updateOne({ _id: order.seller, 'orderHistory.order': order._id }, { $set: { 'orderHistory.$.status': 'cancelled' }, $push: { 'orderHistory.$.statusHistory': { status: 'cancelled', note: order.cancelReason } } })] : []),
      ]);
    }
    await refreshDeliveryMetrics(assignment.deliveryBoy);
    if (order.seller) await refreshSellerMetrics(order.seller);
    return response.json({ ok: true, decision, trackingStatus: order.trackingStatus });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message || 'Could not save the delivery decision.' }); }
});

app.post('/api/orders/:id/cancel', async (request, response) => {
  const reason = request.body.reason?.trim();
  if (!reason || reason.length < 5) return response.status(400).json({ ok: false, message: 'Please enter a cancellation reason (at least 5 characters).' });
  try {
    const order = await findCustomerOrder(request.params.id, request.body.email);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found for this email.' });
    if (['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.trackingStatus)) return response.status(409).json({ ok: false, message: 'This order can no longer be cancelled online.' });
    order.status = 'cancelled'; order.trackingStatus = 'cancelled'; order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: `Customer cancellation: ${reason}` });
    order.trackingEvents.push({ status: 'cancelled', note: 'Order cancelled before dispatch.', occurredAt: new Date() });
    order.disputeHistory.push({ type: 'cancellation', reason, status: 'requested', actor: 'customer' });
    if (order.paymentStatus === 'paid') {
      order.refundRequestedAt = new Date();
      order.paymentLogs.push({ provider: 'Razorpay', amount: order.total, status: 'refund_requested' });
    }
    await order.save();
    const activeAssignments = await DeliveryAssignment.find({ order: order._id, decision: { $in: ['offered', 'accepted'] }, status: { $nin: ['delivered', 'customer_rejected'] } });
    await Promise.all(activeAssignments.map(async (assignment) => {
      assignment.decision = 'rejected'; assignment.rejectedAt = new Date(); await assignment.save();
      await DeliveryBoy.findByIdAndUpdate(assignment.deliveryBoy, { $pull: { assignedOrders: order._id }, $set: { operationalStatus: 'available' } });
    }));
    if (order.seller) await Seller.updateOne({ _id: order.seller, 'orderHistory.order': order._id }, { $set: { 'orderHistory.$.status': 'cancelled' }, $push: { 'orderHistory.$.statusHistory': { status: 'cancelled', note: reason } } });
    return response.json({ ok: true, message: 'Order cancelled.', trackingStatus: order.trackingStatus });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message }); }
});

app.post('/api/orders/:id/return', async (request, response) => {
  const reason = request.body.reason?.trim();
  if (!reason || reason.length < 5) return response.status(400).json({ ok: false, message: 'Please enter a return reason (at least 5 characters).' });
  try {
    const order = await findCustomerOrder(request.params.id, request.body.email);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found for this email.' });
    const deliveredAt = new Date(order.deliveredAt || order.updatedAt).getTime();
    if (order.trackingStatus !== 'delivered' || Date.now() - deliveredAt > 7 * 24 * 60 * 60 * 1000) return response.status(409).json({ ok: false, message: 'Returns are available for 7 days after delivery.' });
    if (order.returnStatus !== 'none') return response.status(409).json({ ok: false, message: 'A return request already exists for this order.' });
    order.returnStatus = 'requested'; order.returnReason = reason; order.returnRequestedAt = new Date();
    order.disputeHistory.push({ type: 'return', reason, status: 'requested', actor: 'customer' });
    order.trackingEvents.push({ status: 'return_requested', note: 'Return request sent to the seller for review.', occurredAt: new Date() });
    await order.save();
    return response.status(201).json({ ok: true, returnStatus: order.returnStatus });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message }); }
});

app.post('/api/orders/:id/return/pickup', async (request, response) => {
  const pickupDate = new Date(request.body.pickupDate);
  if (!request.body.pickupDate || Number.isNaN(pickupDate.getTime()) || pickupDate < new Date(new Date().toDateString())) return response.status(400).json({ ok: false, message: 'Choose a valid pickup date from today onward.' });
  try {
    const order = await findCustomerOrder(request.params.id, request.body.email);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found for this email.' });
    if (order.returnStatus !== 'accepted') return response.status(409).json({ ok: false, message: 'The seller has not accepted this return pickup yet.' });
    order.returnStatus = 'pickup_scheduled'; order.returnPickupDate = pickupDate;
    order.trackingEvents.push({ status: 'return_pickup_scheduled', note: `Return pickup accepted for ${pickupDate.toLocaleDateString()}.`, occurredAt: new Date() });
    await order.save();
    return response.json({ ok: true, returnStatus: order.returnStatus });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message }); }
});

app.post('/api/signup', async (request, response) => {
  try {
    const { firstName, lastName, email, password } = request.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!firstName?.trim() || !lastName?.trim() || !normalizedEmail || !password) {
      return response.status(400).json({ ok: false, message: 'All account fields are required.' });
    }

    if (password.length < 6) {
      return response.status(400).json({ ok: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(409).json({ ok: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return response.status(201).json({
      ok: true,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
    });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/api/login', async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    const passwordMatches = user && await bcrypt.compare(password || '', user.passwordHash);

    if (!passwordMatches) {
      return response.status(401).json({ ok: false, message: 'Invalid email or password.' });
    }

    return response.json({
      ok: true,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      token: createCustomerToken(user),
    });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.get('/api/customer/orders', requireCustomer, async (request, response) => {
  try {
    const email = request.customer.email.toLowerCase();
    const orders = await Order.find({ $expr: { $eq: [{ $toLower: '$customer.email' }, email] } }).sort({ createdAt: -1 }).limit(100).lean();
    return response.json({ ok: true, orders: orders.map((order) => ({
      id: String(order._id), total: order.total, paymentStatus: order.paymentStatus || 'pending',
      status: order.status || 'pending', trackingStatus: order.trackingStatus || 'order_placed',
      createdAt: order.createdAt, items: (order.items || []).map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, image: item.image || '' })),
    })) });
  } catch (error) { return response.status(500).json({ ok: false, message: error.message || 'Could not load order history.' }); }
});

app.get('/api/products', async (_request, response) => {
  try {
    response.json(await Product.find().sort({ createdAt: -1 }));
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

function toStorefrontProduct(product) {
  const data = product.toObject ? product.toObject() : product;
  return {
    ...data,
    id: String(data._id),
    category: String(data.category || '').toLowerCase(),
    image: data.image || '/img/product1.jpeg',
    description: data.description || 'A piece from our independent seller collection.',
    details: data.details || [],
  };
}

app.get('/api/catalog/seller-products', async (_request, response) => {
  try {
    const products = await Product.find({ seller: { $ne: null }, active: { $ne: false } }).sort({ createdAt: -1 });
    return response.json(products.map(toStorefrontProduct));
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
});

app.get('/api/catalog/seller-products/:id', async (request, response) => {
  try {
    const product = mongoose.isValidObjectId(request.params.id)
      ? await Product.findOne({ _id: request.params.id, seller: { $ne: null }, active: { $ne: false } })
      : null;
    if (!product) return response.status(404).json({ message: 'Product not found.' });
    return response.json(toStorefrontProduct(product));
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
});

app.post('/api/products', async (request, response) => {
  try {
    const product = await Product.create(request.body);
    response.status(201).json(product);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.put('/api/products/:id', async (request, response) => {
  try {
    const product = await Product.findOneAndUpdate(
      { $or: [{ id: request.params.id }, { _id: request.params.id }] },
      request.body,
      { new: true, runValidators: true },
    );
    if (!product) return response.status(404).json({ message: 'Product not found' });
    if (product.seller) {
      await Seller.updateOne({ _id: product.seller, 'inventory.product': product._id }, { $set: { 'inventory.$.quantity': product.stock, 'inventory.$.updatedAt': new Date() } });
      await refreshSellerMetrics(product.seller);
    }
    return response.json(product);
  } catch (error) {
    return response.status(400).json({ message: error.message });
  }
});

app.delete('/api/products/:id', async (request, response) => {
  const product = await Product.findOneAndDelete({ $or: [{ id: request.params.id }, { _id: request.params.id }] });
  if (!product) return response.status(404).json({ message: 'Product not found' });
  if (product.seller) {
    await Seller.findByIdAndUpdate(product.seller, { $pull: { catalog: product._id, inventory: { product: product._id } } });
    await refreshSellerMetrics(product.seller);
  }
  return response.json({ ok: true });
});

app.get('/api/collections', async (_request, response) => {
  response.json(await Collection.find().sort({ createdAt: -1 }));
});

app.post('/api/collections', async (request, response) => {
  try {
    response.status(201).json(await Collection.create(request.body));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

app.put('/api/collections/:id', async (request, response) => {
  const collection = await Collection.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true });
  if (!collection) return response.status(404).json({ message: 'Collection not found' });
  return response.json(collection);
});

app.delete('/api/collections/:id', async (request, response) => {
  const collection = await Collection.findByIdAndDelete(request.params.id);
  if (!collection) return response.status(404).json({ message: 'Collection not found' });
  return response.json({ ok: true });
});

app.get('/api/users', async (_request, response) => {
  response.json(await User.find().select('-passwordHash').sort({ createdAt: -1 }));
});

app.get('/api/orders', async (_request, response) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  response.json(orders.map((order) => ({
    id: order._id,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    email: order.customer.email,
    total: order.total,
    status: order.status || 'pending',
    date: order.createdAt,
    items: order.items.reduce((count, item) => count + item.quantity, 0),
  })));
});

app.put('/api/orders/:id', async (request, response) => {
  const order = await Order.findByIdAndUpdate(
    request.params.id,
    { status: request.body.status },
    { new: true, runValidators: true },
  );
  if (!order) return response.status(404).json({ message: 'Order not found' });
  return response.json(order);
});

app.patch('/api/admin/orders/:id/tracking', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;

  const { trackingStatus, courierName, trackingNo } = request.body;
  const allowedTrackingStatuses = ['not_shipped', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'exception'];
  if (typeof trackingStatus !== 'string' || !allowedTrackingStatuses.includes(trackingStatus)) {
    return response.status(400).json({
      ok: false,
      message: `trackingStatus must be one of: ${allowedTrackingStatuses.join(', ')}.`,
    });
  }
  if (courierName !== undefined && typeof courierName !== 'string') {
    return response.status(400).json({ ok: false, message: 'courierName must be a string.' });
  }
  if (trackingNo !== undefined && typeof trackingNo !== 'string') {
    return response.status(400).json({ ok: false, message: 'trackingNo must be a string.' });
  }

  try {
    const update = {
      trackingStatus,
      ...(courierName !== undefined ? { courierName: courierName.trim() } : {}),
      ...(trackingNo !== undefined ? { trackingNo: trackingNo.trim() } : {}),
    };
    const order = await Order.findByIdAndUpdate(request.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found.' });
    return response.json({ ok: true, order });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.get('/api/admin/sellers', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    const sellers = await Seller.find().select('-passwordHash').sort({ createdAt: -1 });
    await Promise.all(sellers.map((seller) => refreshSellerMetrics(seller._id)));
    const current = await Seller.find().select('-passwordHash').sort({ createdAt: -1 });
    return response.json(current.map((seller) => {
      const history = seller.orderHistory || [];
      return {
        ...seller.toObject(),
        totalFulfilledOrders: history.filter((order) => ['fulfilled', 'completed'].includes(order.status)).length,
        confirmedAwaitingProcessing: history.filter((order) => order.status === 'accepted').length,
        pendingOrders: history.filter((order) => order.status === 'pending').length,
        rejectedOrders: history.filter((order) => order.status === 'rejected').length,
      };
    }));
  } catch (error) { return response.status(500).json({ message: error.message }); }
});

app.get('/api/admin/sellers/:id', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ message: 'Seller not found.' });
    await refreshSellerMetrics(request.params.id);
    const seller = await Seller.findById(request.params.id).select('-passwordHash');
    if (!seller) return response.status(404).json({ message: 'Seller not found.' });
    const [products, orders] = await Promise.all([
      Product.find({ seller: seller._id, active: { $ne: false } }).sort({ createdAt: -1 }),
      Order.find({ seller: seller._id }).sort({ createdAt: -1 }),
    ]);
    const history = seller.orderHistory || [];
    return response.json({
      seller, products, orders,
      metrics: {
        totalActiveListings: products.length,
        realTimeStockLevels: products.reduce((sum, product) => sum + product.stock, 0),
        cumulativeProductsSold: seller.cumulativeProductsSold,
        totalGeneratedRevenue: seller.totalGeneratedRevenue,
        totalFulfilledOrders: history.filter((order) => ['fulfilled', 'completed'].includes(order.status)).length,
        confirmedAwaitingProcessing: history.filter((order) => order.status === 'accepted').length,
        pendingOrders: history.filter((order) => order.status === 'pending').length,
        rejectedOrders: history.filter((order) => order.status === 'rejected').length,
      },
    });
  } catch (error) { return response.status(500).json({ message: error.message }); }
});

app.post('/api/admin/sellers/:id/payout', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  const amount = Number(request.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return response.status(400).json({ message: 'Enter a payout amount greater than zero.' });
  try {
    await refreshSellerMetrics(request.params.id);
    const seller = await Seller.findById(request.params.id);
    if (!seller) return response.status(404).json({ message: 'Seller not found.' });
    const pending = Number(seller.paymentSummary?.pendingSettlements || 0);
    if (amount > pending) return response.status(409).json({ message: 'Payout cannot exceed the pending settlement amount.' });
    await Seller.updateOne({ _id: seller._id }, {
      $inc: { 'paymentSummary.payouts': amount, 'paymentSummary.paidAmount': amount },
      $set: { 'paymentSummary.lastPayoutAt': new Date() },
      $push: { 'paymentSummary.transactions': { type: 'payout', reference: request.body.reference || `PAYOUT-${Date.now()}`, amount, status: 'paid' } },
    });
    await refreshSellerMetrics(seller._id);
    return response.json({ ok: true, seller: await Seller.findById(seller._id).select('-passwordHash') });
  } catch (error) { return response.status(400).json({ message: error.message }); }
});

app.get('/api/admin/delivery-boys', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  const riders = await DeliveryBoy.find().select('-passwordHash').sort({ createdAt: -1 });
  await Promise.all(riders.map((rider) => refreshDeliveryMetrics(rider._id)));
  const [currentRiders, busyIds] = await Promise.all([
    DeliveryBoy.find().select('-passwordHash').sort({ createdAt: -1 }),
    DeliveryAssignment.distinct('deliveryBoy', { decision: { $in: ['offered', 'accepted'] }, status: { $nin: ['delivered', 'customer_rejected'] } }),
  ]);
  const busy = new Set(busyIds.map(String));
  return response.json(currentRiders.map((rider) => ({ ...rider.toObject(), available: rider.active && rider.operationalStatus !== 'offline' && !busy.has(String(rider._id)) })));
});

app.get('/api/admin/delivery-orders', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    const activeAssignments = await DeliveryAssignment.find({ decision: { $in: ['offered', 'accepted'] } }).distinct('order');
    const orders = await Order.find({ _id: { $nin: activeAssignments }, trackingStatus: { $ne: 'delivered' } }).sort({ createdAt: -1 });
    return response.json(orders.map((order) => ({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      city: order.customer.city,
      total: order.total,
      status: order.status,
    })));
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message });
  }
});

app.get('/api/admin/delivery-assignments', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    const assignments = await DeliveryAssignment.find().populate('order').populate('deliveryBoy', 'name email').sort({ createdAt: -1 });
    return response.json(assignments.filter((assignment) => assignment.order));
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message });
  }
});

app.post('/api/admin/orders/:id/assign-delivery', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    const { deliveryBoyId, payoutAmount = 0 } = request.body;
    if (!mongoose.isValidObjectId(deliveryBoyId) || !Number.isFinite(Number(payoutAmount)) || Number(payoutAmount) < 0) {
      return response.status(400).json({ ok: false, message: 'Valid deliveryBoyId and non-negative payoutAmount are required.' });
    }
    const [order, deliveryBoy] = await Promise.all([
      Order.findById(request.params.id), DeliveryBoy.findOne({ _id: deliveryBoyId, active: true }),
    ]);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found.' });
    if (!deliveryBoy) return response.status(404).json({ ok: false, message: 'Active delivery account not found.' });
    const riderBusy = await DeliveryAssignment.exists({
      deliveryBoy: deliveryBoy._id,
      decision: { $in: ['offered', 'accepted'] },
      status: { $nin: ['delivered', 'customer_rejected'] },
    });
    if (riderBusy) return response.status(409).json({ ok: false, message: 'This delivery partner already has an open offer or active delivery.' });
    const current = await DeliveryAssignment.findOne({ order: order._id, decision: { $in: ['offered', 'accepted'] } });
    if (current) return response.status(409).json({ ok: false, message: 'This order already has an active delivery assignment.' });
    const assignment = await DeliveryAssignment.create({ order: order._id, deliveryBoy: deliveryBoy._id, payoutAmount: Number(payoutAmount) });
    await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, { $addToSet: { assignedOrders: order._id }, $set: { operationalStatus: 'on_delivery' }, $push: { payoutRecords: { order: order._id, amount: Number(payoutAmount), status: 'pending' } } });
    await refreshDeliveryMetrics(deliveryBoy._id);
    order.deliveryBoy = deliveryBoy._id;
    await order.save();
    return response.status(201).json({ ok: true, assignment });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.patch('/api/admin/delivery-assignments/:id/payment', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  const { paymentStatus } = request.body;
  if (!['pending', 'paid'].includes(paymentStatus)) return response.status(400).json({ ok: false, message: 'paymentStatus must be pending or paid.' });
  try {
    const assignment = await DeliveryAssignment.findByIdAndUpdate(request.params.id, {
      paymentStatus,
      paidAt: paymentStatus === 'paid' ? new Date() : null,
    }, { new: true, runValidators: true });
    if (!assignment) return response.status(404).json({ ok: false, message: 'Delivery assignment not found.' });
    await DeliveryBoy.updateOne({ _id: assignment.deliveryBoy, 'payoutRecords.order': assignment.order }, { $set: { 'payoutRecords.$.status': paymentStatus, 'payoutRecords.$.paidAt': paymentStatus === 'paid' ? new Date() : null } });
    return response.json({ ok: true, assignment });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.get('/api/admin/order-control', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return response.json(orders.map((order) => ({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      email: order.customer.email,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      refundRequestedAt: order.refundRequestedAt,
      paymentLogs: order.paymentLogs || [],
      trackingStatus: order.trackingStatus,
      trackingEvents: order.trackingEvents || [],
      cancelReason: order.cancelReason,
      returnStatus: order.returnStatus,
      returnReason: order.returnReason,
      disputeHistory: order.disputeHistory || [],
    })));
  } catch (error) { return response.status(500).json({ ok: false, message: error.message }); }
});

app.patch('/api/admin/orders/:id/status', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  const { status, note = 'Admin updated order status.' } = request.body;
  const allowed = ['pending', 'accepted', 'rejected', 'fulfilled', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return response.status(400).json({ ok: false, message: 'Unsupported order status.' });
  try {
    const order = await Order.findById(request.params.id);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found.' });
    order.status = status;
    order.statusHistory.push({ status, note: String(note).slice(0, 300) });
    if (status === 'cancelled') order.trackingStatus = 'cancelled';
    if (status === 'fulfilled' || status === 'completed') { order.trackingStatus = 'delivered'; order.deliveredAt = order.deliveredAt || new Date(); }
    order.trackingEvents.push({ status: status === 'fulfilled' || status === 'completed' ? 'delivered' : status, note: String(note).slice(0, 300), occurredAt: new Date() });
    await order.save();
    return response.json({ ok: true, orderId: order._id, status: order.status });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message }); }
});

app.patch('/api/admin/orders/:id/refund', async (request, response) => {
  if (!requireAdminApiKey(request, response)) return;
  const { status, reference = '' } = request.body;
  if (!['refunded', 'refund_rejected'].includes(status)) return response.status(400).json({ ok: false, message: 'Status must be refunded or refund_rejected.' });
  try {
    const order = await Order.findById(request.params.id);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found.' });
    if (!order.refundRequestedAt) return response.status(409).json({ ok: false, message: 'This order has no refund request.' });
    if (status === 'refunded') order.paymentStatus = 'refunded';
    if (status === 'refund_rejected') order.refundRequestedAt = undefined;
    order.paymentLogs.push({ provider: 'Razorpay', paymentReference: reference, amount: order.total, status, createdAt: new Date() });
    order.disputeHistory.push({ type: 'refund', reason: order.cancelReason || order.returnReason, status, actor: 'admin' });
    await order.save();
    return response.json({ ok: true, paymentStatus: order.paymentStatus });
  } catch (error) { return response.status(400).json({ ok: false, message: error.message }); }
});

app.post('/api/delivery/login', async (request, response) => {
  try {
    const deliveryBoy = await DeliveryBoy.findOne({ email: request.body.email?.trim().toLowerCase(), active: true });
    if (!deliveryBoy || !await bcrypt.compare(request.body.password || '', deliveryBoy.passwordHash)) {
      return response.status(401).json({ ok: false, message: 'Invalid email or password.' });
    }
    return response.json({
      ok: true,
      token: createDeliveryToken(deliveryBoy),
      deliveryBoy: { id: deliveryBoy._id, name: deliveryBoy.name, email: deliveryBoy.email },
    });
  } catch (error) {
    return response.status(503).json({ ok: false, message: error.message });
  }
});

app.post('/api/delivery/signup', async (request, response) => {
  try {
    const { name, email, password } = request.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || !password || password.length < 8) {
      return response.status(400).json({ ok: false, message: 'Name, email, and a password of at least 8 characters are required.' });
    }
    const deliveryBoy = await DeliveryBoy.create({
      name: name.trim(), email: normalizedEmail, phone: (request.body.phone || '').trim(),
      personalIdentification: request.body.personalIdentification || {}, address: request.body.address || {}, location: request.body.location || {},
      passwordHash: await bcrypt.hash(password, 10),
    });
    return response.status(201).json({ ok: true, message: 'Account created. Sign in to continue.', deliveryBoy: { id: deliveryBoy._id, name: deliveryBoy.name, email: deliveryBoy.email } });
  } catch (error) {
    return response.status(409).json({ ok: false, message: error.code === 11000 ? 'An account with this email already exists.' : error.message });
  }
});

app.get('/api/delivery/stats', async (_request, response) => {
  try {
    const [riders, busyIds] = await Promise.all([
      DeliveryBoy.find({ active: true }).select('_id'),
      DeliveryAssignment.distinct('deliveryBoy', { decision: { $in: ['offered', 'accepted'] }, status: { $nin: ['delivered', 'customer_rejected'] } }),
    ]);
    const busy = new Set(busyIds.map(String));
    return response.json({ total: riders.length, available: riders.filter((rider) => !busy.has(String(rider._id))).length });
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message });
  }
});

app.get('/api/delivery/me', requireDeliveryBoy, (request, response) => {
  response.json({ id: request.deliveryBoy._id, name: request.deliveryBoy.name, email: request.deliveryBoy.email });
});

app.get('/api/delivery/assignments', requireDeliveryBoy, async (request, response) => {
  try {
    const assignments = await DeliveryAssignment.find({ deliveryBoy: request.deliveryBoy._id })
      .populate('order').sort({ createdAt: -1 });
    return response.json(assignments.filter((assignment) => assignment.order));
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message });
  }
});

app.patch('/api/delivery/assignments/:id/decision', requireDeliveryBoy, async (request, response) => {
  const { decision } = request.body;
  if (!['accepted', 'rejected'].includes(decision)) return response.status(400).json({ ok: false, message: 'Decision must be accepted or rejected.' });
  try {
    const assignment = await DeliveryAssignment.findOne({ _id: request.params.id, deliveryBoy: request.deliveryBoy._id, decision: 'offered' });
    if (!assignment) return response.status(404).json({ ok: false, message: 'Open delivery offer not found.' });
    assignment.decision = decision;
    if (decision === 'accepted') assignment.acceptedAt = new Date();
    else assignment.rejectedAt = new Date();
    await assignment.save();
    if (decision === 'accepted') await Promise.all([
      Order.findByIdAndUpdate(assignment.order, { deliveryStatus: 'Accepted' }),
      DeliveryBoy.findByIdAndUpdate(request.deliveryBoy._id, { $set: { operationalStatus: 'on_delivery' } }),
    ]);
    if (decision === 'rejected') {
      await Promise.all([
        Order.findByIdAndUpdate(assignment.order, { $unset: { deliveryBoy: 1 }, $set: { deliveryStatus: '', status: 'pending' }, $push: { statusHistory: { status: 'pending', note: 'Delivery partner rejected the offer.' } } }),
        DeliveryBoy.findByIdAndUpdate(request.deliveryBoy._id, { $pull: { assignedOrders: assignment.order }, $set: { operationalStatus: 'available' }, $push: { deliveryHistory: { order: assignment.order, status: 'rejected' } } }),
      ]);
      const rejectedOrder = await Order.findById(assignment.order);
      if (rejectedOrder?.seller) await Seller.updateOne({ _id: rejectedOrder.seller, 'orderHistory.order': rejectedOrder._id }, { $set: { 'orderHistory.$.status': 'pending' }, $push: { 'orderHistory.$.statusHistory': { status: 'pending', note: 'Delivery partner rejected the offer.' } } });
    }
    await refreshDeliveryMetrics(request.deliveryBoy._id);
    return response.json({ ok: true, assignment });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.patch('/api/delivery/assignments/:id/status', requireDeliveryBoy, async (request, response) => {
  const { status } = request.body;
  if (status !== 'out_for_delivery') return response.status(400).json({ ok: false, message: 'Delivery partners can start delivery only; the customer confirms receipt.' });
  try {
    const assignment = await DeliveryAssignment.findOne({ _id: request.params.id, deliveryBoy: request.deliveryBoy._id, decision: 'accepted' });
    if (!assignment) return response.status(404).json({ ok: false, message: 'Active delivery not found.' });
    if (assignment.status === 'out_for_delivery') return response.json({ ok: true, assignment });
    if (!['assigned', 'picked_up'].includes(assignment.status)) return response.status(409).json({ ok: false, message: `Cannot start delivery from ${assignment.status}.` });
    if (!assignment.pickupConfirmedAt) return response.status(409).json({ ok: false, message: 'Wait for the seller to confirm the pickup first.' });
    const order = await Order.findById(assignment.order);
    if (!order) return response.status(404).json({ ok: false, message: 'Order not found.' });
    assignment.status = status;
    await assignment.save();
    order.trackingStatus = 'out_for_delivery';
    order.trackingEvents = Array.isArray(order.trackingEvents) ? order.trackingEvents : [];
    order.trackingEvents.push({ status: 'out_for_delivery', note: 'Your delivery partner is on the way. Review the order details and confirm or reject the delivery.', occurredAt: new Date() });
    await order.save();
    await DeliveryBoy.findByIdAndUpdate(request.deliveryBoy._id, { $set: { operationalStatus: 'on_delivery' } });
    await refreshDeliveryMetrics(request.deliveryBoy._id);
    return response.json({ ok: true, assignment });
  } catch (error) {
    return response.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/api/admin/login', (request, response) => {
  const { email, password } = request.body;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || email?.toLowerCase().trim() !== process.env.ADMIN_EMAIL.toLowerCase().trim() || password !== process.env.ADMIN_PASSWORD) {
    return response.status(401).json({ ok: false, message: 'Invalid admin credentials.' });
  }

  try {
    return response.json({
    ok: true,
    token: createAdminToken(process.env.ADMIN_EMAIL),
    admin: { email: process.env.ADMIN_EMAIL, role: 'admin' },
    });
  } catch (error) {
    return response.status(503).json({ ok: false, message: error.message });
  }
});

app.use('/api', (request, response) => {
  response.status(404).json({ ok: false, message: `API endpoint ${request.method} ${request.path} not found.` });
});

app.use('/api', (error, _request, response, next) => {
  if (response.headersSent) return next(error);

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  if (status === 500) console.error('API request failed:', error);

  return response.status(status).json({
    ok: false,
    message: status === 500 ? 'Internal server error.' : error.message,
  });
});

