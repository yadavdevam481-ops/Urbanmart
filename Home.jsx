import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getProductCategories } from "../api";
import ProductCard from "../components/ProductCard";

const Home = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProductCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    getProducts({ search, category: activeCategory })
      .then((res) => setProducts(res.data))
      .catch(() => setError("Failed to load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [search, activeCategory]);

  return (
    <div className="home-page">
      <div className="hero-banner">
        <h1>Groceries delivered to your doorstep 🥦🥛🍞</h1>
        <p>Fresh produce, daily essentials, and more — all in one place.</p>
      </div>

      <div className="category-filters">
        <button
          className={activeCategory === "All" ? "active" : ""}
          onClick={() => setActiveCategory("All")}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? "active" : ""}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {search && (
        <p className="search-info">
          Showing results for: <strong>{search}</strong>
        </p>
      )}

      {loading && <p className="status-msg">Loading products...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="status-msg">No products found.</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Home;
