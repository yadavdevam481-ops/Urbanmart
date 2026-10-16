import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4>🛒 UrbanKart</h4>
          <p>Your everyday online grocery & mart store. Fresh products, delivered fast.</p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <p>Fruits & Vegetables</p>
          <p>Dairy & Bakery</p>
          <p>Snacks & Beverages</p>
          <p>Household Essentials</p>
        </div>
        <div className="footer-col">
          <h4>Help</h4>
          <p>Track Order</p>
          <p>Returns & Refunds</p>
          <p>Contact Us</p>
          <p>FAQs</p>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <p>support@urbankart.com</p>
          <p>+91 98765 43210</p>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} UrbanKart. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
