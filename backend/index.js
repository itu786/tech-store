// backend/index.js

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config(); // Load variables from .env file

const app = express();
const PORT = 3000;

// Database setup
const db = new sqlite3.Database('./users.db');
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT,
  googleId TEXT
)`);

db.run(`
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Middleware
app.use(cors({
  origin: 'http://localhost:5500',
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'verysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: false
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', id, (err, row) => {
    if (err) return done(err);
    done(null, row);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  db.get('SELECT * FROM users WHERE googleId = ?', profile.id, (err, row) => {
    if (err) return done(err);
    if (row) {
      return done(null, row);
    } else {
      db.run(
        'INSERT INTO users (username, email, googleId) VALUES (?, ?, ?)',
        [profile.displayName, profile.emails[0].value, profile.id],
        function (err) {
          if (err) return done(err);
          db.get('SELECT * FROM users WHERE id = ?', this.lastID, (err, row) => {
            done(null, row);
          });
        }
      );
    }
  });
}));

// Routes

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // ✅ FIXED: Save user ID to session for cart use
    req.session.userId = req.user.id;
    res.redirect('http://localhost:5500/profile.html');
  }
);

app.post('/api/cart/add', (req, res) => {
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

app.post('/api/cart/remove', (req, res) => {
  const userId = req.session.userId;
  const { productId } = req.body;

  if (!userId) return res.status(401).json({ message: 'Not logged in' });
  if (!productId) return res.status(400).json({ message: 'Missing product ID' });

  db.run(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed from cart' });
  });
});

app.get('/api/cart', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  db.all(`SELECT product_id, quantity FROM cart_items WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// ✅ FIXED: Manual login route uses session.userId
app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('Username required');
  db.run('INSERT INTO users (username) VALUES (?)', [username], function (err) {
    if (err) return res.status(500).send('Database error');
    req.session.userId = this.lastID;
    res.json({ message: 'Logged in', userId: this.lastID });
  });
});

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else if (req.session.userId) {
    db.get('SELECT * FROM users WHERE id = ?', req.session.userId, (err, row) => {
      if (err) return res.status(500).json({ user: null });
      res.json({ user: row });
    });
  } else {
    res.status(401).json({ user: null });
  }
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('http://localhost:5500');
  });
});

// ✅ FIXED: Moved this below app declaration
const cartRoutes = require('./cart')(db); // Pass db into the router function
app.use('/api/cart', cartRoutes);
app.get('/test-env', (req, res) => {
  res.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
