const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run(`ALTER TABLE users ADD COLUMN googleId TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column googleId already exists, no changes made.');
      } else {
        console.error('Error adding column:', err.message);
      }
    } else {
      console.log('Column googleId added successfully.');
    }
  });
});

db.close();
