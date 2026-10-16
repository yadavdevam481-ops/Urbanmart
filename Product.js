const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      required: true,
      enum: [
        "Fruits & Vegetables",
        "Dairy & Bakery",
        "Snacks",
        "Beverages",
        "Staples",
        "Personal Care",
        "Household",
        "Other",
      ],
      default: "Other",
    },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    unit: { type: String, default: "1 pc" }, // e.g. "500 g", "1 L", "1 dozen"
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
    },
    stock: { type: Number, default: 100, min: 0 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
