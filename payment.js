const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");
const { priceCart, reduceStock } = require("../utils/pricing");

const router = express.Router();

// Create the Razorpay client lazily so COD still works if keys are missing
let razorpay;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Online payments are not configured on the server");
    err.status = 503;
    throw err;
  }
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Constant-time string comparison (prevents timing attacks)
const safeEqual = (a, b) => {
  const A = Buffer.from(String(a || ""), "utf8");
  const B = Buffer.from(String(b || ""), "utf8");
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

// Atomically flips an order to Paid. Safe if /verify and the webhook race each other:
// only the call that actually performs the update reduces stock.
const markPaid = async (orderId, paymentId, signature) => {
  const set = {
    paymentStatus: "Paid",
    "paymentResult.razorpayPaymentId": paymentId,
    "paymentResult.paidAt": new Date(),
  };
  if (signature) set["paymentResult.razorpaySignature"] = signature;

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "Paid" } },
    { $set: set },
    { new: true }
  );
  if (updated) await reduceStock(updated.items);
  return updated || (await Order.findById(orderId));
};

// @route   POST /api/payment/create-order
// @desc    Price the cart on the server, create our Order + a Razorpay order
router.post("/create-order", protect, async (req, res) => {
  try {
    const rzp = getRazorpay();
    const { items: cartItems, deliveryAddress } = req.body;

    const priced = await priceCart(cartItems);

    const order = await Order.create({
      user: req.user._id,
      ...priced,
      deliveryAddress,
      paymentMethod: "ONLINE",
      paymentStatus: "Pending",
    });

    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create({
        amount: Math.round(priced.totalAmount * 100), // paise
        currency: "INR",
        receipt: order._id.toString(),
        notes: { orderId: order._id.toString(), userId: req.user._id.toString() },
      });
    } catch (e) {
      await order.deleteOne(); // don't leave orphan orders
      throw e;
    }

    order.paymentResult.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key id only; the secret never leaves the server
      name: req.user.name,
      email: req.user.email,
    });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || "Could not start payment" });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify the signature Razorpay returns to the browser after payment
router.post("/verify", protect, async (req, res) => {
  try {
    getRazorpay();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const order = await Order.findOne({
      "paymentResult.razorpayOrderId": razorpay_order_id,
      user: req.user._id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeEqual(expected, razorpay_signature)) {
      await Order.updateOne(
        { _id: order._id, paymentStatus: { $ne: "Paid" } },
        { paymentStatus: "Failed" }
      );
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const paid = await markPaid(order._id, razorpay_payment_id, razorpay_signature);
    res.json({ message: "Payment successful", order: paid });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || "Verification error" });
  }
});

// Webhook: safety net if the customer closes the tab right after paying.
// Mounted in server.js with express.raw() BEFORE express.json().
const webhookHandler = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ message: "Webhook not configured" });

    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    if (!safeEqual(expected, signature)) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const payment = event.payload?.payment?.entity;

    if (payment?.order_id) {
      const order = await Order.findOne({
        "paymentResult.razorpayOrderId": payment.order_id,
      });

      if (order) {
        const amountOk = payment.amount === Math.round(order.totalAmount * 100);

        if ((event.event === "payment.captured" || event.event === "order.paid") && amountOk) {
          await markPaid(order._id, payment.id);
        } else if (event.event === "payment.failed") {
          await Order.updateOne(
            { _id: order._id, paymentStatus: { $ne: "Paid" } },
            { paymentStatus: "Failed" }
          );
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: "Webhook error" });
  }
};

module.exports = router;
module.exports.webhookHandler = webhookHandler;
