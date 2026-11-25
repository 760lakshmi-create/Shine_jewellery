# Shine Jewelry — Standalone Project

A standalone version of the Shine Jewelry website, ready to run on your own computer (no Replit dependency).

## Requirements
- Node.js 18+ (https://nodejs.org)

## Setup
```bash
npm install
npm run dev
```
Open the URL shown in the terminal (default: http://localhost:5173).

## Production frontend and API

Set `VITE_API_BASE_URL` in the frontend hosting provider to the backend API base URL, including `/api` (for example, `https://shine-jewellery.onrender.com/api`).
Set `FRONTEND_URL` in the backend hosting provider to the deployed frontend origin (for example, `https://shine-jewellery-beta.vercel.app`, without a trailing slash). Multiple allowed origins can be comma-separated.
Redeploy both services after changing their environment variables. Local `.env` values are not automatically applied to hosted services.

## Build for production
```bash
npm run build
npm run serve
```

## MongoDB API setup
1. Install MongoDB locally, or create a MongoDB Atlas cluster.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your connection string.
3. Install dependencies and start the API:
```bash
npm install
npm run server
```
4. Check `http://localhost:5000/api/health`. A successful connection returns `"database":"connected"`.

Run the frontend separately with `npm run dev`.

## Delivery partner dashboard

Set `API_PORT=5001`, `ADMIN_API_KEY`, and `DELIVERY_TOKEN_SECRET` in `.env`, then run `npm run server`. Delivery partners create their own accounts from `/delivery`; passwords are stored as bcrypt hashes. The dashboard uses port 5001 so it does not collide with a stale API process already listening on port 5000. Delivery API sessions expire after seven days.

The admin dashboard at `/admin` has a **Delivery** section for viewing self-registered rider accounts and their availability, assigning unassigned orders to an available rider with a payout amount, and marking assignment payouts paid or pending. Admins need to sign in again after updating the API so the dashboard can store its protected API session.

Admin dashboard endpoints accept the admin bearer token from sign in (or the `x-admin-key` header for server-side API calls):

- `POST /api/delivery/signup` with `{ "name": "Rider Name", "email": "rider@example.com", "password": "at-least-8-chars" }`
- `GET /api/delivery/stats` returns the total and currently available delivery partner counts.
- `POST /api/admin/orders/:orderId/assign-delivery` with `{ "deliveryBoyId": "...", "payoutAmount": 100 }`
- `PATCH /api/admin/delivery-assignments/:assignmentId/payment` with `{ "paymentStatus": "paid" }` (or `pending`)

Delivery partners sign in with `POST /api/delivery/login` and send the returned bearer token in `Authorization` for `/api/delivery/me`, `/api/delivery/assignments`, and the decision/status endpoints. They can accept or reject offers, then advance accepted deliveries through picked up, out for delivery, and delivered. Assignment history retains rejected and completed jobs along with payout amounts and payment status.

## Customer order tracking and after-sales

After payment, the checkout confirmation links to `/track-order/:orderId`. Customers verify the order with the checkout email, see tracking events and an estimated delivery date, and receive a 6-digit delivery OTP on the tracking page when the parcel is out for delivery. The delivery partner must verify that OTP before marking the order delivered. Customers can cancel before dispatch with a required reason, or request a return within seven days of delivery. Sellers review returns and confirm receipt after the customer accepts a pickup date. Admins can inspect order status, payment logs, cancellations, returns and refund requests in the **Order Control** dashboard section.

## Notes
- The API uses Express and Mongoose. Cart and wishlist are still stored in the browser's localStorage until API models/routes are added.
- All product images and the hero video are included under `public/`.
