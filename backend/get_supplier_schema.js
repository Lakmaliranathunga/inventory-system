const fs = require('fs');
const db = require('c:/Users/LapMart.LK/Desktop/inventory-system/backend/db.js');

db.query("SHOW COLUMNS FROM suppliers", (err, result) => {
  if (err) {
    console.error(err);
  } else {
    fs.writeFileSync('c:/Users/LapMart.LK/Desktop/inventory-system/backend/supplier_schema.json', JSON.stringify(result.map(r => r.Field), null, 2));
  }
  process.exit();
});
