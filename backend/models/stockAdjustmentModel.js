const db = require("../db");

const StockAdjustmentModel = {
  getAll: (callback) => {
    const sql = `
      SELECT st.transactionId as adjustmentId, st.itemId, st.transactionType as adjustmentType, 
             st.quantity, st.transactionDate as adjustmentDate, st.remarks, st.createdBy,
             i.itemName, i.itemCode, i.serialNumber, sup.supplierName
      FROM stock_transactions st
      LEFT JOIN inventory_items i ON st.itemId = i.itemId
      LEFT JOIN invoices inv ON i.invoiceId = inv.invoiceId
      LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
      WHERE st.flag = 1 AND st.transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION')
      ORDER BY st.transactionDate DESC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT st.transactionId as adjustmentId, st.itemId, st.transactionType as adjustmentType, 
             st.quantity, st.transactionDate as adjustmentDate, st.remarks, st.createdBy,
             i.itemName, i.itemCode, i.serialNumber, sup.supplierName
      FROM stock_transactions st
      LEFT JOIN inventory_items i ON st.itemId = i.itemId
      LEFT JOIN invoices inv ON i.invoiceId = inv.invoiceId
      LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
      WHERE st.transactionId = ? AND st.flag = 1
    `;
    db.query(sql, [id], callback);
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO stock_transactions (
        itemId, transactionType, quantity, transactionDate, 
        remarks, createdBy, flag
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    const values = [
      data.itemId,
      data.adjustmentType,
      data.quantity,
      data.adjustmentDate || new Date(),
      data.remarks || null,
      data.createdBy
    ];
    db.query(sql, values, callback);
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE stock_transactions 
      SET itemId=?, transactionType=?, quantity=?, transactionDate=?, 
          remarks=?, updatedBy=?, updatedDate=NOW()
      WHERE transactionId=?
    `;
    const values = [
      data.itemId,
      data.adjustmentType,
      data.quantity,
      data.adjustmentDate,
      data.remarks || null,
      data.updatedBy,
      id
    ];
    db.query(sql, values, callback);
  },

  softDelete: (id, deletedBy, callback) => {
    const sql = `
      UPDATE stock_transactions 
      SET flag=0, deletedBy=?, deletedDate=NOW() 
      WHERE transactionId=?
    `;
    db.query(sql, [deletedBy, id], callback);
  },

  getDashboardStats: (callback) => {
    const sql = `
      SELECT 
        SUM(CASE WHEN transactionType = 'IN' THEN quantity ELSE 0 END) as totalIn,
        SUM(CASE WHEN transactionType = 'OUT' THEN quantity ELSE 0 END) as totalOut,
        SUM(CASE WHEN transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION') THEN quantity ELSE 0 END) as totalTransfer
      FROM stock_transactions
      WHERE flag = 1
    `;
    db.query(sql, callback);
  }
};

module.exports = StockAdjustmentModel;
