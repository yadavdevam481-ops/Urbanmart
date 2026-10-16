const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/auth");
const { priceCart, reduceStock } = require("../utils/pricing");

const router = express.Router();

// Hide abandoned/failed online checkouts from order lists
const visibleOrders = { $or: [{ paymentMethod: "COD" }, { paymentStatus: "Paid" }] };

// @route   POST /api/orders
// @desc    Place a Cash-on-Delivery order (online payments go through /api/payment)
router.post("/", protect, async (req, res) => {
  try {
    const { items: cartItems, deliveryAddress } = req.body;

    // Totals are computed on the server from DB prices
    const priced = await priceCart(cartItems);

    const order = await Order.create({
      user: req.user._id,
      ...priced,
      deliveryAddress,
      paymentMethod: "COD",
      paymentStatus: "Pending", // collected at delivery
    });

    await reduceStock(order.items);
    res.status(201).json(order);
  } catch (err) {
    res
      .status(err.status || 400)
      .json({ message: err.message || "Could not place order" });
  }
});

// @route   GET /api/orders/myorders
router.get("/myorders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, ...visibleOrders }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/orders  (admin)
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find(visibleOrders)
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PUT /api/orders/:id/status  (admin)
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    // COD is considered paid once delivered
    if (order.paymentMethod === "COD" && status === "Delivered") {
      order.paymentStatus = "Paid";
    }
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
