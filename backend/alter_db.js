const db = require("./db");
db.query("ALTER TABLE invoices ADD COLUMN invoiceImage VARCHAR(255) NULL;", (err, res) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.error("DB Error:", err);
  } else {
    console.log("Column added or already exists.");
  }
  process.exit(0);
});
