import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyOrders } from "../api";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  Placed: "#f59e0b",
  Packed: "#3b82f6",
  "Out for Delivery": "#8b5cf6",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      getMyOrders()
        .then((res) => setOrders(res.data))
        .catch(() => setError("Failed to load orders."))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, navigate]);

  if (loading) return <p className="status-msg">Loading orders...</p>;
  if (error) return <p className="status-msg error">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <p className="status-msg">You haven't placed any orders yet.</p>
        <Link to="/" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.map((order) => (
        <div className="order-card" key={order._id}>
          <div className="order-card-header">
            <div>
              <p className="order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
              <p className="order-date">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className="order-status"
              style={{ backgroundColor: statusColors[order.status] || "#888" }}
            >
              {order.status}
            </span>
          </div>

          <div className="order-items">
            {order.items.map((item, idx) => (
              <div className="order-item" key={idx}>
                <img src={item.image} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <p className="product-unit">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-card-footer">
            <span>
              {order.paymentMethod === "ONLINE" ? "Paid online" : "Cash on Delivery"} ·{" "}
              <span className={`pay-badge ${order.paymentStatus.toLowerCase()}`}>
                {order.paymentStatus}
              </span>
            </span>
            <span className="order-total">Total: ₹{order.totalAmount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Orders;
