const db = require("../db");

const StockAdjustmentModel = {
  getAll: (callback) => {
    const sql = `
      SELECT sa.adjustmentId, sa.itemId, sa.adjustmentType, 
             sa.quantity, sa.adjustmentDate, sa.remarks, sa.createdBy,
             i.itemName, i.itemCode, i.serialNumber, sup.supplierName, u.uFullName as createdByName
      FROM stock_adjustments sa
      LEFT JOIN inventory_items i ON sa.itemId = i.itemId
      LEFT JOIN invoices inv ON i.invoiceId = inv.invoiceId
      LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
      LEFT JOIN users u ON sa.createdBy = u.uId
      WHERE sa.flag = 1 AND sa.adjustmentType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION', 'Damaged', 'Disposal')
      ORDER BY sa.adjustmentDate DESC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT sa.adjustmentId, sa.itemId, sa.adjustmentType, 
             sa.quantity, sa.adjustmentDate, sa.remarks, sa.createdBy,
             i.itemName, i.itemCode, i.serialNumber, sup.supplierName, u.uFullName as createdByName
      FROM stock_adjustments sa
      LEFT JOIN inventory_items i ON sa.itemId = i.itemId
      LEFT JOIN invoices inv ON i.invoiceId = inv.invoiceId
      LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
      LEFT JOIN users u ON sa.createdBy = u.uId
      WHERE sa.adjustmentId = ? AND sa.flag = 1
    `;
    db.query(sql, [id], callback);
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO stock_adjustments (
        itemId, adjustmentType, quantity, adjustmentDate, 
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
      UPDATE stock_adjustments 
      SET itemId=?, adjustmentType=?, quantity=?, adjustmentDate=?, 
          remarks=?, updatedBy=?, updatedDate=NOW()
      WHERE adjustmentId=?
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
      UPDATE stock_adjustments 
      SET flag=0, deletedBy=?, deletedDate=NOW() 
      WHERE adjustmentId=?
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
