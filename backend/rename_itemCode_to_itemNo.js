const db = require("./db");

const runRename = async () => {
  console.log("Renaming MySQL column 'itemCode' -> 'itemNo' in 'inventory_items' table...");

  try {
    // Check columns of inventory_items
    const cols = await new Promise((resolve, reject) => {
      db.query("DESCRIBE inventory_items", (err, res) => (err ? reject(err) : resolve(res)));
    });

    const colNames = cols.map(c => c.Field);

    if (colNames.includes("itemCode") && !colNames.includes("itemNo")) {
      const alterSql = "ALTER TABLE inventory_items CHANGE COLUMN itemCode itemNo VARCHAR(100)";
      await new Promise((resolve, reject) => {
        db.query(alterSql, (err, res) => {
          if (err) return reject(err);
          console.log("SUCCESS: Column 'itemCode' successfully renamed to 'itemNo' in table 'inventory_items'!");
          resolve(res);
        });
      });
    } else if (colNames.includes("itemNo")) {
      console.log("Notice: Column 'itemNo' already exists in table 'inventory_items'.");
    } else {
      console.log("Notice: Neither 'itemCode' nor 'itemNo' was found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Column Rename Error:", error);
    process.exit(1);
  }
};

runRename();
