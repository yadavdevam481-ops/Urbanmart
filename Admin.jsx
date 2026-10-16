import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
} from "../api";

const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Bakery",
  "Snacks",
  "Beverages",
  "Staples",
  "Personal Care",
  "Household",
  "Other",
];

const STATUSES = ["Placed", "Packed", "Out for Delivery", "Delivered", "Cancelled"];

const emptyForm = {
  name: "",
  description: "",
  category: "Other",
  price: "",
  mrp: "",
  unit: "",
  image: "",
  stock: "",
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadProducts = () => {
    getProducts().then((res) => setProducts(res.data));
  };

  const loadOrders = () => {
    getAllOrders().then((res) => setOrders(res.data));
  };

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadOrders();
    }
  }, [isAdmin]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp) || Number(form.price),
        stock: Number(form.stock) || 0,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage("Product updated successfully.");
      } else {
        await createProduct(payload);
        setMessage("Product created successfully.");
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      mrp: product.mrp,
      unit: product.unit,
      image: product.image,
      stock: product.stock,
    });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
    loadProducts();
  };

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
    loadOrders();
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>

      <div className="admin-tabs">
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
          Manage Products
        </button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          Manage Orders
        </button>
      </div>

      {tab === "products" && (
        <div className="admin-section">
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            {message && <p className="status-msg">{message}</p>}

            <div className="form-grid">
              <input
                name="name"
                placeholder="Product name"
                required
                value={form.name}
                onChange={handleFormChange}
              />
              <select name="category" value={form.category} onChange={handleFormChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                placeholder="Price (₹)"
                required
                value={form.price}
                onChange={handleFormChange}
              />
              <input
                name="mrp"
                type="number"
                placeholder="MRP (₹)"
                value={form.mrp}
                onChange={handleFormChange}
              />
              <input
                name="unit"
                placeholder="Unit (e.g. 500 g, 1 L)"
                value={form.unit}
                onChange={handleFormChange}
              />
              <input
                name="stock"
                type="number"
                placeholder="Stock quantity"
                value={form.stock}
                onChange={handleFormChange}
              />
              <input
                name="image"
                placeholder="Image URL"
                value={form.image}
                onChange={handleFormChange}
              />
            </div>
            <textarea
              name="description"
              placeholder="Product description"
              value={form.description}
              onChange={handleFormChange}
            />

            <div className="admin-form-actions">
              <button className="btn-primary" type="submit">
                {editingId ? "Update Product" : "Add Product"}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2>All Products ({products.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img className="admin-thumb" src={p.image} alt={p.name} />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button className="link-btn" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    <button className="link-btn danger" onClick={() => handleDelete(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <div className="admin-section">
          <h2>All Orders ({orders.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>#{o._id.slice(-8).toUpperCase()}</td>
                  <td>
                    {o.user?.name}
                    <br />
                    <small>{o.user?.email}</small>
                  </td>
                  <td>{o.items.length} item(s)</td>
                  <td>₹{o.totalAmount}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;
