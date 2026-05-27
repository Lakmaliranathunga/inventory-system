const fs = require('fs');
const db = require('c:/Users/LapMart.LK/Desktop/inventory-system/backend/db.js');
db.query("SHOW COLUMNS FROM inventory_items", (err, result) => {
    if (err) console.error(err);
    else fs.writeFileSync('c:/Users/LapMart.LK/Desktop/inventory-system/backend/inventory_schema.json', JSON.stringify(result, null, 2));
    process.exit();
});
