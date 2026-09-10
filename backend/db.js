const mysql = require("mysql2");
const { database } = require('./config');

const db = mysql.createPool({
  ...database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.query('SELECT 1', (err) => {
  if (err) console.error("MySQL connection failed:", err.message);
  else console.log("MySQL Connected");
});

module.exports = db;
