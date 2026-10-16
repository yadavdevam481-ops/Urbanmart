import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-card-img-wrap">
          <img src={product.image} alt={product.name} />
          {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
        </div>
        <div className="product-card-body">
          <p className="product-category">{product.category}</p>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-unit">{product.unit}</p>
          <div className="product-price-row">
            <span className="product-price">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="product-mrp">₹{product.mrp}</span>
            )}
          </div>
        </div>
      </Link>
      <button
        className="add-to-cart-btn"
        onClick={() => addToCart(product, 1)}
        disabled={product.stock === 0}
      >
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
};

export default ProductCard;
