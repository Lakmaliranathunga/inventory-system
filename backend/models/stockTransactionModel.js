const db = require("../db");

const StockTransactionModel = {
  getAll: (callback) => {
    const sql = `
      SELECT st.*, 
             i.itemName, i.itemCode,
             dFrom.description as fromDivisionName,
             dTo.description as toDivisionName
      FROM stock_transactions st
      LEFT JOIN inventory_items i ON st.itemId = i.itemId
      LEFT JOIN divisions dFrom ON st.fromDivisionId = dFrom.division_id
      LEFT JOIN divisions dTo ON st.toDivisionId = dTo.division_id
      WHERE st.flag = 1
      ORDER BY st.transactionDate DESC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT st.*, 
             i.itemName, i.itemCode,
             dFrom.description as fromDivisionName,
             dTo.description as toDivisionName
      FROM stock_transactions st
      LEFT JOIN inventory_items i ON st.itemId = i.itemId
      LEFT JOIN divisions dFrom ON st.fromDivisionId = dFrom.division_id
      LEFT JOIN divisions dTo ON st.toDivisionId = dTo.division_id
      WHERE st.transactionId = ? AND st.flag = 1
    `;
    db.query(sql, [id], callback);
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO stock_transactions (
        itemId, transactionType, quantity, transactionDate, 
        fromDivisionId, toDivisionId, remarks, createdBy, flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    const values = [
      data.itemId,
      data.transactionType,
      data.quantity,
      data.transactionDate || new Date(),
      data.fromDivisionId || null,
      data.toDivisionId || null,
      data.remarks || null,
      data.createdBy
    ];
    db.query(sql, values, callback);
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE stock_transactions 
      SET itemId=?, transactionType=?, quantity=?, transactionDate=?, 
          fromDivisionId=?, toDivisionId=?, remarks=?, updatedBy=?, updatedDate=NOW()
      WHERE transactionId=?
    `;
    const values = [
      data.itemId,
      data.transactionType,
      data.quantity,
      data.transactionDate,
      data.fromDivisionId || null,
      data.toDivisionId || null,
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
        SUM(CASE WHEN transactionType = 'TRANSFER' THEN quantity ELSE 0 END) as totalTransfer
      FROM stock_transactions
      WHERE flag = 1
    `;
    db.query(sql, callback);
  },

  getRecent: (limit, callback) => {
    const sql = `
      SELECT st.*, 
             i.itemName,
             dFrom.description as fromDivisionName,
             dTo.description as toDivisionName
      FROM stock_transactions st
      LEFT JOIN inventory_items i ON st.itemId = i.itemId
      LEFT JOIN divisions dFrom ON st.fromDivisionId = dFrom.division_id
      LEFT JOIN divisions dTo ON st.toDivisionId = dTo.division_id
      WHERE st.flag = 1
      ORDER BY st.transactionDate DESC
      LIMIT ?
    `;
    db.query(sql, [limit], callback);
  }
};

module.exports = StockTransactionModel;
