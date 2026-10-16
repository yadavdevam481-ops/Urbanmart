import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { placeOrder, createPaymentOrder, verifyPayment } from "../api";

// Loads Razorpay's hosted checkout script on demand
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    line1: user?.address?.line1 || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    phone: user?.address?.phone || "",
  });
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Display-only: the server recalculates the real total from DB prices
  const deliveryFee = cartTotal > 500 || cartTotal === 0 ? 0 : 30;
  const grandTotal = cartTotal + deliveryFee;

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const finishSuccess = () => {
    clearCart();
    setSuccess(true);
    setTimeout(() => navigate("/orders"), 1800);
  };

  // Only product ids + quantities are sent. Prices are NOT trusted from the browser.
  const buildPayloadItems = () =>
    cartItems.map((item) => ({ product: item._id, quantity: item.quantity }));

  const payOnline = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Could not load the payment window. Check your internet connection.");

    const { data } = await createPaymentOrder({
      items: buildPayloadItems(),
      deliveryAddress: address,
    });

    let completed = false;

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "UrbanKart",
      description: "Grocery order",
      prefill: { name: data.name, email: data.email, contact: address.phone },
      theme: { color: "#16a34a" },

      // Called after a successful payment -> verify the signature on OUR server
      handler: async (response) => {
        completed = true;
        try {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          finishSuccess();
        } catch (err) {
          setError(
            err.response?.data?.message ||
              "We couldn't confirm your payment. If money was deducted, it will be reconciled automatically or refunded."
          );
        } finally {
          setPlacing(false);
        }
      },

      modal: {
        ondismiss: () => {
          if (!completed) {
            setError("Payment cancelled. Your cart is safe — you can try again.");
            setPlacing(false);
          }
        },
      },
    });

    rzp.on("payment.failed", (resp) => {
      setError(resp.error?.description || "Payment failed. Please try again.");
      setPlacing(false);
    });

    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!address.line1 || !address.city || !address.pincode || !address.phone) {
      setError("Please fill in all delivery address fields.");
      return;
    }

    setError("");
    setPlacing(true);

    try {
      if (paymentMethod === "ONLINE") {
        await payOnline(); // placing flag is cleared by the Razorpay callbacks
        return;
      }

      // Cash on Delivery
      await placeOrder({
        items: buildPayloadItems(),
        deliveryAddress: address,
      });
      finishSuccess();
      setPlacing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to place order.");
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div className="cart-page">
        <div className="success-box">
          <h2>🎉 Order placed successfully!</h2>
          <p>Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <p className="status-msg">Your cart is empty. Start shopping!</p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <img src={item.image} alt={item.name} />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="product-unit">{item.unit}</p>
                <p className="product-price">₹{item.price}</p>
              </div>
              <div className="qty-selector">
                <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
              </div>
              <p className="cart-item-subtotal">₹{item.price * item.quantity}</p>
              <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="summary-row">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{grandTotal}</span>
          </div>

          <h3>Delivery Address</h3>
          <input name="line1" placeholder="Address line" value={address.line1} onChange={handleAddressChange} />
          <input name="city" placeholder="City" value={address.city} onChange={handleAddressChange} />
          <input name="state" placeholder="State" value={address.state} onChange={handleAddressChange} />
          <input name="pincode" placeholder="Pincode" value={address.pincode} onChange={handleAddressChange} />
          <input name="phone" placeholder="Phone number" value={address.phone} onChange={handleAddressChange} />

          <h3>Payment Method</h3>
          <div className="payment-options">
            <label className={`payment-option ${paymentMethod === "ONLINE" ? "selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="ONLINE"
                checked={paymentMethod === "ONLINE"}
                onChange={() => setPaymentMethod("ONLINE")}
              />
              <div>
                <strong>Pay Online</strong>
                <small>UPI, Cards, Netbanking, Wallets</small>
              </div>
            </label>
            <label className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              <div>
                <strong>Cash on Delivery</strong>
                <small>Pay when your order arrives</small>
              </div>
            </label>
          </div>

          {paymentMethod === "ONLINE" && (
            <p className="secure-note">
              🔒 Secure payment by Razorpay. UrbanKart never sees or stores your card, UPI or bank details.
            </p>
          )}

          {error && <p className="status-msg error">{error}</p>}

          <button className="btn-primary full-width" onClick={handlePlaceOrder} disabled={placing}>
            {placing
              ? "Please wait..."
              : paymentMethod === "ONLINE"
              ? `Pay ₹${grandTotal} securely`
              : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
