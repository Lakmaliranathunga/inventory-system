const db = require("./db");

const runMigration = async () => {
  console.log("Starting MySQL Database Migration: stock_transactions -> stock_adjustments...");

  try {
    // 1. Create stock_adjustments table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        adjustmentId INT AUTO_INCREMENT PRIMARY KEY,
        itemId INT NOT NULL,
        adjustmentType VARCHAR(50) NOT NULL DEFAULT 'DAMAGED',
        quantity INT NOT NULL DEFAULT 1,
        adjustmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT,
        createdBy INT,
        updatedBy INT,
        deletedBy INT,
        createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedDate TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deletedDate TIMESTAMP NULL,
        flag INT DEFAULT 1,
        CONSTRAINT fk_stock_adj_item FOREIGN KEY (itemId) REFERENCES inventory_items(itemId) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await new Promise((resolve, reject) => {
      db.query(createTableSql, (err, res) => {
        if (err) return reject(err);
        console.log("SUCCESS: Table 'stock_adjustments' created or already exists.");
        resolve(res);
      });
    });

    // 2. Check if stock_transactions table exists
    const checkTableSql = "SHOW TABLES LIKE 'stock_transactions'";
    const tables = await new Promise((resolve, reject) => {
      db.query(checkTableSql, (err, res) => (err ? reject(err) : resolve(res)));
    });

    if (tables.length > 0) {
      // 3. Migrate data from stock_transactions to stock_adjustments
      const migrateDataSql = `
        INSERT IGNORE INTO stock_adjustments (
          adjustmentId, itemId, adjustmentType, quantity, adjustmentDate, remarks, createdBy, updatedBy, deletedBy, createdDate, updatedDate, deletedDate, flag
        )
        SELECT 
          transactionId, itemId, transactionType, quantity, transactionDate, remarks, createdBy, updatedBy, deletedBy, createdDate, updatedDate, deletedDate, flag
        FROM stock_transactions
      `;

      await new Promise((resolve, reject) => {
        db.query(migrateDataSql, (err, res) => {
          if (err) {
            console.warn("Notice during data migration:", err.message);
          } else {
            console.log(`SUCCESS: Migrated ${res.affectedRows} records from stock_transactions to stock_adjustments.`);
          }
          resolve();
        });
      });

      // 4. Drop stock_transactions table
      const dropTableSql = "DROP TABLE IF EXISTS stock_transactions";
      await new Promise((resolve, reject) => {
        db.query(dropTableSql, (err, res) => {
          if (err) return reject(err);
          console.log("SUCCESS: Legacy table 'stock_transactions' dropped from MySQL database.");
          resolve(res);
        });
      });
    } else {
      console.log("Notice: Table 'stock_transactions' does not exist, no migration needed.");
    }

    console.log("Database Migration Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

runMigration();
