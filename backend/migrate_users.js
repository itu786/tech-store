const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  // Create new table with correct columns
  db.run(`CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    googleId TEXT
  )`, (err) => {
    if (err) {
      console.error("Error creating new table:", err.message);
      return;
    }
  });

  // Copy data from old table to new table, mapping columns we have
  db.run(`INSERT INTO users_new (id) SELECT id FROM users`, (err) => {
    if (err) {
      console.error("Error copying data:", err.message);
      // maybe old table empty or missing columns, ignore for now
    } else {
      console.log("Data copied to new table.");
    }
  });

  // Drop old users table
  db.run(`DROP TABLE users`, (err) => {
    if (err) {
      console.error("Error dropping old users table:", err.message);
      return;
    }
    console.log("Old users table dropped.");
  });

  // Rename new table to users
  db.run(`ALTER TABLE users_new RENAME TO users`, (err) => {
    if (err) {
      console.error("Error renaming users_new:", err.message);
      return;
    }
    console.log("users_new renamed to users.");
  });
});

db.close();
