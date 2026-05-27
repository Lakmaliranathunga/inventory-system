const fs = require('fs');
const db = require('c:/Users/LapMart.LK/Desktop/inventory-system/backend/db.js');

const tables = ['divisions', 'sections'];
let count = 0;
let output = {};

tables.forEach(table => {
  db.query(`SHOW COLUMNS FROM ${table}`, (err, result) => {
    if (err) output[table] = err.message;
    else output[table] = result.map(r => r.Field);

    count++;
    if (count === tables.length) {
      fs.writeFileSync('c:/Users/LapMart.LK/Desktop/inventory-system/backend/tables_schema.json', JSON.stringify(output, null, 2));
      process.exit();
    }
  });
});
