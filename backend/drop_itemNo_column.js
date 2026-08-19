const db = require("./db");

const dropColumn = async () => {
  console.log("Dropping column 'itemNo' from table 'inventory_items'...");

  try {
    const cols = await new Promise((resolve, reject) => {
      db.query("DESCRIBE inventory_items", (err, res) => (err ? reject(err) : resolve(res)));
    });

    const colNames = cols.map(c => c.Field);

    if (colNames.includes("itemNo")) {
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE inventory_items DROP COLUMN itemNo", (err, res) => {
          if (err) return reject(err);
          console.log("SUCCESS: Column 'itemNo' successfully dropped from 'inventory_items'.");
          resolve(res);
        });
      });
    } else {
      console.log("Notice: Column 'itemNo' does not exist in 'inventory_items'.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Drop Column Error:", error);
    process.exit(1);
  }
};

dropColumn();
