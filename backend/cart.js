const express = require('express');
const router = express.Router();
const db = require('./db');

// Middleware to check if logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Not logged in' });
}

// Create cart table if not exists
db.run(`CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  product_id TEXT,
  quantity INTEGER
)`);

// Add item to cart
router.post('/add', isLoggedIn, (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  // Check if item already in cart
  db.get(
    `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`,
    [userId, productId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        // Update quantity
        const newQty = row.quantity + quantity;
        db.run(
          `UPDATE cart SET quantity = ? WHERE id = ?`,
          [newQty, row.id],
          err => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Cart updated' });
          }
        );
      } else {
        // Insert new item
        db.run(
          `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`,
          [userId, productId, quantity],
          err => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Item added to cart' });
          }
        );
      }
    }
  );
});

// Get cart items
router.get('/', isLoggedIn, (req, res) => {
  const userId = req.user.id;
  db.all(`SELECT * FROM cart WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Remove item
router.post('/remove', isLoggedIn, (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  db.run(
    `DELETE FROM cart WHERE user_id = ? AND product_id = ?`,
    [userId, productId],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item removed' });
    }
  );
});

// Update quantity
router.post('/update', isLoggedIn, (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  db.run(
    `UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?`,
    [quantity, userId, productId],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Quantity updated' });
    }
  );
});

module.exports = router;
