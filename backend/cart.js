// backend/cart.js
const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.post('/add', (req, res) => {
    const userId = req.session.userId;
    const { productId, quantity } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (!productId || !quantity) return res.status(400).json({ message: 'Missing data' });

    db.get(`SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], (err, row) => {
      if (err) return res.status(500).json({ message: 'DB error' });

      if (row) {
        db.run(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [quantity, row.id], (err) => {
          if (err) return res.status(500).json({ message: 'DB error' });
          res.json({ message: 'Cart updated' });
        });
      } else {
        db.run(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`, [userId, productId, quantity], (err) => {
          if (err) return res.status(500).json({ message: 'DB error' });
          res.json({ message: 'Item added to cart' });
        });
      }
    });
  });

  router.post('/remove', (req, res) => {
    const userId = req.session.userId;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (!productId) return res.status(400).json({ message: 'Missing product ID' });

    db.run(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], function(err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Item not found' });
      res.json({ message: 'Item removed from cart' });
    });
  });

  router.get('/', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    db.all(`SELECT product_id, quantity FROM cart_items WHERE user_id = ?`, [userId], (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    });
  });

  return router;
};
