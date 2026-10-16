const Product = require("../models/Product");

const FREE_DELIVERY_ABOVE = 500;
const DELIVERY_FEE = 30;

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Builds trusted order totals from DB prices. NEVER trust prices sent by the client.
async function priceCart(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw httpError(400, "No order items");
  }

  const ids = cartItems.map((i) => i.product);
  let products;
  try {
    products = await Product.find({ _id: { $in: ids } });
  } catch (e) {
    throw httpError(400, "Invalid product in cart");
  }
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  let itemsPrice = 0;

  for (const ci of cartItems) {
    const p = byId.get(String(ci.product));
    const qty = Math.floor(Number(ci.quantity));

    if (!p) throw httpError(400, "A product in your cart is no longer available");
    if (!qty || qty < 1) throw httpError(400, "Invalid quantity");
    if (p.stock < qty) {
      throw httpError(400, `Only ${p.stock} of "${p.name}" left in stock`);
    }

    items.push({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: qty,
      image: p.image,
    });
    itemsPrice += p.price * qty;
  }

  const deliveryFee = itemsPrice > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { items, itemsPrice, deliveryFee, totalAmount: itemsPrice + deliveryFee };
}

// Decrement stock (only where enough stock remains)
async function reduceStock(items) {
  await Product.bulkWrite(
    items.map((i) => ({
      updateOne: {
        filter: { _id: i.product, stock: { $gte: i.quantity } },
        update: { $inc: { stock: -i.quantity } },
      },
    }))
  );
}

module.exports = { priceCart, reduceStock, httpError };
