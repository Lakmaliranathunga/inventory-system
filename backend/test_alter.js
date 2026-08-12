const db = require('./db');

   const sql = `ALTER TABLE inventory_items ADD COLUMN invoiceId INT NULL AFTER serialNumber`;
   db.query(sql, (err, result) => {
     if (err) {
       console.error("Error adding column:", err);
       process.exit(1);
     }
     console.log("Column invoiceId added successfully");
     process.exit(0);
   });
