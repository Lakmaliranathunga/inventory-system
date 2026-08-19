const db = require("./db");

const restoreColumn = async () => {
  console.log("Restoring column 'itemCode' to table 'inventory_items'...");

  try {
    const cols = await new Promise((resolve, reject) => {
      db.query("DESCRIBE inventory_items", (err, res) => (err ? reject(err) : resolve(res)));
    });

    const colNames = cols.map(c => c.Field);

    if (!colNames.includes("itemCode")) {
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE inventory_items ADD COLUMN itemCode VARCHAR(100) AFTER itemId", (err, res) => {
          if (err) return reject(err);
          console.log("SUCCESS: Column 'itemCode' added to 'inventory_items'.");
          resolve(res);
        });
      });

      // Update existing items with a fallback itemCode if null
      await new Promise((resolve, reject) => {
        db.query("UPDATE inventory_items SET itemCode = CONCAT('ITEM-', itemId) WHERE itemCode IS NULL OR itemCode = ''", (err, res) => {
          if (err) return reject(err);
          console.log("SUCCESS: Population of default itemCode complete.");
          resolve(res);
        });
      });
    } else {
      console.log("Notice: Column 'itemCode' already exists in 'inventory_items'.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Restore Column Error:", error);
    process.exit(1);
  }
};

restoreColumn();
