require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const User = require("./models/User");

const products = [
  {
    name: "Fresh Bananas",
    description: "Farm-fresh ripe bananas, rich in potassium.",
    category: "Fruits & Vegetables",
    price: 40,
    mrp: 50,
    unit: "1 dozen",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
    stock: 200,
    rating: 4.3,
    isFeatured: true,
  },
  {
    name: "Red Tomatoes",
    description: "Juicy, farm-picked tomatoes.",
    category: "Fruits & Vegetables",
    price: 30,
    mrp: 35,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
    stock: 150,
    rating: 4.1,
  },
  {
    name: "Amul Toned Milk",
    description: "Pasteurized toned milk, rich and creamy.",
    category: "Dairy & Bakery",
    price: 27,
    mrp: 28,
    unit: "500 ml",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    stock: 300,
    rating: 4.6,
    isFeatured: true,
  },
  {
    name: "Brown Bread",
    description: "Whole wheat brown bread, soft and healthy.",
    category: "Dairy & Bakery",
    price: 45,
    mrp: 50,
    unit: "400 g",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    stock: 100,
    rating: 4.2,
  },
  {
    name: "Lay's Classic Salted Chips",
    description: "Crispy potato chips, classic salted flavor.",
    category: "Snacks",
    price: 20,
    mrp: 20,
    unit: "52 g",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400",
    stock: 500,
    rating: 4.4,
    isFeatured: true,
  },
  {
    name: "Digestive Biscuits",
    description: "Wheat-based digestive biscuits, light and crunchy.",
    category: "Snacks",
    price: 35,
    mrp: 40,
    unit: "250 g",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
    stock: 250,
    rating: 4.0,
  },
  {
    name: "Coca-Cola",
    description: "Chilled refreshing soft drink.",
    category: "Beverages",
    price: 40,
    mrp: 40,
    unit: "750 ml",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400",
    stock: 300,
    rating: 4.5,
  },
  {
    name: "Real Orange Juice",
    description: "100% natural orange fruit juice.",
    category: "Beverages",
    price: 99,
    mrp: 110,
    unit: "1 L",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
    stock: 120,
    rating: 4.3,
  },
  {
    name: "Basmati Rice",
    description: "Premium long-grain basmati rice.",
    category: "Staples",
    price: 180,
    mrp: 200,
    unit: "5 kg",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    stock: 100,
    rating: 4.7,
    isFeatured: true,
  },
  {
    name: "Toor Dal",
    description: "Premium quality split pigeon peas.",
    category: "Staples",
    price: 140,
    mrp: 150,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400",
    stock: 150,
    rating: 4.4,
  },
  {
    name: "Sunflower Cooking Oil",
    description: "Refined sunflower oil, heart-healthy.",
    category: "Staples",
    price: 150,
    mrp: 165,
    unit: "1 L",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
    stock: 130,
    rating: 4.2,
  },
  {
    name: "Colgate Toothpaste",
    description: "Cavity protection toothpaste.",
    category: "Personal Care",
    price: 55,
    mrp: 60,
    unit: "150 g",
    image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400",
    stock: 200,
    rating: 4.5,
  },
  {
    name: "Dove Soap",
    description: "Moisturizing beauty bar soap.",
    category: "Personal Care",
    price: 45,
    mrp: 48,
    unit: "100 g",
    image: "https://images.unsplash.com/photo-1585232004423-a5e6ca4e3d97?w=400",
    stock: 220,
    rating: 4.6,
  },
  {
    name: "Surf Excel Detergent",
    description: "Powerful stain removal detergent powder.",
    category: "Household",
    price: 120,
    mrp: 135,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1610557892470-55d587fbfd42?w=400",
    stock: 90,
    rating: 4.3,
  },
  {
    name: "Harpic Toilet Cleaner",
    description: "Powerful germ-killing toilet cleaner.",
    category: "Household",
    price: 85,
    mrp: 95,
    unit: "500 ml",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400",
    stock: 110,
    rating: 4.1,
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for seeding");

    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`🛒 Seeded ${products.length} products`);

    const adminExists = await User.findOne({ email: "admin@urbankart.com" });
    if (!adminExists) {
      await User.create({
        name: "UrbanKart Admin",
        email: "admin@urbankart.com",
        password: "admin123",
        role: "admin",
      });
      console.log("👤 Seeded admin user -> admin@urbankart.com / admin123");
    }

    console.log("✅ Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    process.exit(1);
  }
};

seedData();
