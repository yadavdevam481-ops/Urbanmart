import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("urbankart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getProfile = () => api.get("/auth/profile");
export const updateProfile = (data) => api.put("/auth/profile", data);

// ---- Products ----
export const getProducts = (params) => api.get("/products", { params });
export const getProductCategories = () => api.get("/products/categories");
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ---- Payments (Razorpay) ----
export const createPaymentOrder = (data) => api.post("/payment/create-order", data);
export const verifyPayment = (data) => api.post("/payment/verify", data);

// ---- Orders ----
export const placeOrder = (data) => api.post("/orders", data);
export const getMyOrders = () => api.get("/orders/myorders");
export const getAllOrders = () => api.get("/orders");
export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status });

export default api;
