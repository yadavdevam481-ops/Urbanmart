# 🛒 UrbanKart — Online Grocery / Mart Store

A full-stack MERN grocery e-commerce app: browse products by category, search,
add to cart, checkout, track orders, and manage everything from an admin
dashboard.

## Tech Stack

- **Frontend:** React 18 + Vite, React Router, Context API (Auth & Cart), Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
- **Payments:** Razorpay (UPI, cards, netbanking, wallets) + Cash on Delivery

## Project Structure

```
urbankart/
├── frontend/          # React (Vite) app
│   └── src/
│       ├── components/   # Navbar, ProductCard, Footer
│       ├── pages/        # Home, Product, Cart, Login, Register, Orders, Admin
│       ├── context/       # AuthContext, CartContext
│       ├── App.jsx
│       ├── api.js
│       └── styles.css
└── backend/           # Express API
    ├── models/         # User, Product, Order
    ├── routes/         # auth, products, orders, payment
    ├── middleware/      # auth (JWT + admin guard)
    ├── utils/          # pricing.js (server-side totals + stock)
    ├── server.js
    ├── seed.js
    └── .env
```

## Setup

### 1. Backend

```bash
cd backend
npm install
# Update .env with your MongoDB URI and JWT secret if needed
npm run seed     # populates sample products + an admin user
npm run dev      # starts the API on http://localhost:5000
```

Requires a running MongoDB instance (local or Atlas). Update `MONGO_URI` in
`backend/.env` accordingly.

**Seeded admin login:** `admin@urbankart.com` / `admin123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # starts the app on http://localhost:5173
```

The frontend calls the API at `http://localhost:5000/api` by default. To
override, create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000/api
```

## Features

- 🛍️ Browse groceries by category, search by name
- 🛒 Persistent cart (localStorage) with quantity controls
- 🔐 JWT-based register/login, protected routes
- 📦 Checkout with delivery address & payment method (COD/UPI/Card)
- 📋 Order history for users, with live status
- 🛠️ Admin dashboard: add/edit/delete products, update order status
- 📱 Responsive layout

## Online Payments (Razorpay)

1. Create a free account at https://razorpay.com and stay in **Test Mode**.
2. Dashboard -> Settings -> API Keys -> Generate Test Key. Put them in `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxx
   ```
3. (Recommended) Dashboard -> Settings -> Webhooks -> add
   `https://YOUR_PUBLIC_URL/api/payment/webhook`, select events
   `payment.captured`, `payment.failed`, `order.paid`, and set the same secret as
   `RAZORPAY_WEBHOOK_SECRET`. For local testing expose your port with a tunnel (e.g. ngrok).
4. Restart the backend. At checkout choose **Pay Online**.

**Test credentials (Test Mode only):** card `4111 1111 1111 1111`, any future expiry,
any CVV, any OTP; UPI id `success@razorpay` (success) or `failure@razorpay` (failure).

### How the payment flow stays secure

- The browser sends only product ids + quantities. The server recomputes prices,
  delivery fee and total from the database (a customer cannot edit the amount).
- Razorpay card/UPI/bank details are entered inside Razorpay's own window and never
  touch UrbanKart servers.
- After payment, the server verifies Razorpay's HMAC-SHA256 signature using the secret
  key (kept only in `backend/.env`) before marking an order Paid.
- A signed webhook acts as a safety net if the customer closes the tab mid-payment.
- Marking Paid is atomic, so a verify + webhook race can't double-reduce stock.
- **Never commit `.env` or put the key secret in the frontend.** Use live keys
  and HTTPS only after Razorpay KYC/activation.

## API Overview

| Method | Endpoint                  | Description                    | Auth        |
|--------|----------------------------|---------------------------------|-------------|
| POST   | /api/auth/register         | Register new user               | Public      |
| POST   | /api/auth/login            | Login                            | Public      |
| GET    | /api/auth/profile          | Get current user                 | User        |
| PUT    | /api/auth/profile          | Update profile/address           | User        |
| GET    | /api/products              | List products (search/category)  | Public      |
| GET    | /api/products/categories   | List categories                  | Public      |
| GET    | /api/products/:id          | Get product detail               | Public      |
| POST   | /api/products              | Create product                   | Admin       |
| PUT    | /api/products/:id          | Update product                   | Admin       |
| DELETE | /api/products/:id          | Delete product                   | Admin       |
| POST   | /api/orders                | Place COD order                  | User        |
| POST   | /api/payment/create-order  | Start online payment             | User        |
| POST   | /api/payment/verify        | Verify Razorpay signature        | User        |
| POST   | /api/payment/webhook       | Razorpay webhook (signed)        | Razorpay    |
| GET    | /api/orders/myorders       | Get my orders                    | User        |
| GET    | /api/orders                | Get all orders                   | Admin       |
| PUT    | /api/orders/:id/status     | Update order status              | Admin       |

## Notes

- This is a starter/demo project intended for learning and further
  customization — add payment gateway integration, image uploads, pagination,
  and stronger validation before production use.
