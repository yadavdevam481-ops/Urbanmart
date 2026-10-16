import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../api";
import { useCart } from "../context/CartContext";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getProductById(id)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="status-msg">Loading...</p>;
  if (error) return <p className="status-msg error">{error}</p>;
  if (!product) return null;

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  return (
    <div className="product-page">
      <div className="product-detail">
        <div className="product-detail-img">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-detail-info">
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-unit">{product.unit}</p>
          <p className="product-rating">⭐ {product.rating} / 5</p>

          <div className="product-price-row large">
            <span className="product-price">₹{product.price}</span>
            {discount > 0 && (
              <>
                <span className="product-mrp">₹{product.mrp}</span>
                <span className="discount-badge inline">{discount}% OFF</span>
              </>
            )}
          </div>

          <p className="product-description">{product.description}</p>
          <p className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
            {product.stock > 0 ? `In stock (${product.stock} available)` : "Out of stock"}
          </p>

          <div className="qty-selector">
            <label>Quantity:</label>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <div className="product-actions">
            <button
              className="btn-secondary"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>
            <button
              className="btn-primary"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
