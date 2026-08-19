const db = require("./db");

const cleanupFlagZero = async () => {
  console.log("Starting cleanup of soft-deleted records (flag = 0)...");

  const tables = [
    "stock_adjustments",
    "inventory_items",
    "invoices",
    "suppliers",
    "item_types",
    "main_categories",
    "sub_categories",
    "divisions",
    "sections",
    "users",
    "user_roles"
  ];

  try {
    for (const table of tables) {
      await new Promise((resolve) => {
        db.query(`DELETE FROM ${table} WHERE flag = 0`, (err, res) => {
          if (err) {
            console.log(`Notice for table ${table}:`, err.message);
          } else if (res.affectedRows > 0) {
            console.log(`SUCCESS: Deleted ${res.affectedRows} record(s) with flag=0 from '${table}'.`);
          } else {
            console.log(`Table '${table}': 0 soft-deleted records found.`);
          }
          resolve();
        });
      });
    }

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup Error:", error);
    process.exit(1);
  }
};

cleanupFlagZero();
