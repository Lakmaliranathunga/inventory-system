const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. DASHBOARD STATS (Reports Overview)
router.get("/dashboard", async (req, res) => {
  try {
    const totalInventoryValue = await new Promise((resolve, reject) => {
      // In a real system, you'd multiply quantity * unitPrice per item.
      // Alternatively, we use total sum of invoices to approximate investment.
      db.query("SELECT SUM(totalAmount) as totalValue FROM invoices WHERE flag=1", (err, result) => {
        if (err) reject(err); else resolve(result[0].totalValue || 0);
      });
    });

    const totalItems = await new Promise((resolve, reject) => {
      db.query("SELECT SUM(quantity) as count FROM inventory_items WHERE flag=1", (err, result) => {
        if (err) reject(err); else resolve(result[0].count || 0);
      });
    });

    const totalSuppliers = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM suppliers WHERE flag=1", (err, result) => {
          if (err) reject(err); else resolve(result[0].count || 0);
        });
    });

    const totalInvoices = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM invoices WHERE flag=1", (err, result) => {
          if (err) reject(err); else resolve(result[0].count || 0);
        });
    });

    const lowStockItems = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= 5 AND flag=1", (err, result) => {
          if (err) reject(err); else resolve(result[0].count || 0);
        });
    });

    const monthlyPurchases = await new Promise((resolve, reject) => {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        db.query(`SELECT SUM(totalAmount) as total FROM invoices WHERE MONTH(createdDate) = ? AND YEAR(createdDate) = ? AND flag=1`, [month, year], (err, result) => {
          if (err) reject(err); else resolve(result[0].total || 0);
        });
    });

    const yearlyPurchases = await new Promise((resolve, reject) => {
        const year = new Date().getFullYear();
        db.query(`SELECT SUM(totalAmount) as total FROM invoices WHERE YEAR(createdDate) = ? AND flag=1`, [year], (err, result) => {
          if (err) reject(err); else resolve(result[0].total || 0);
        });
    });

    res.json({
      success: true,
      stats: {
        totalInventoryValue,
        totalItems,
        monthlyPurchases,
        yearlyPurchases,
        totalSuppliers,
        totalInvoices,
        lowStockItems
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

// Helper for building common item joins with stock adjustment information
const getBaseItemQuery = () => `
    SELECT i.*, 
        t.itemTypeName, 
        m.mainCategoryName, 
        s.subCategoryName,
        d.description as divisionName,
        sec.sectionname as sectionName,
        adj.adjustmentType,
        adj.adjustmentDate,
        adj.adjustmentRemarks
    FROM inventory_items i
    LEFT JOIN item_types t ON i.itemTypeId = t.itemTypeId
    LEFT JOIN main_categories m ON i.mainCategoryId = m.mainCategoryId
    LEFT JOIN sub_categories s ON i.subCategoryId = s.subCategoryId
    LEFT JOIN divisions d ON i.divisionId = d.division_id
    LEFT JOIN sections sec ON i.sectionId = sec.sectionid
    LEFT JOIN (
        SELECT st1.itemId, st1.transactionType as adjustmentType, st1.transactionDate as adjustmentDate, st1.remarks as adjustmentRemarks
        FROM stock_transactions st1
        INNER JOIN (
            SELECT itemId, MAX(transactionId) as maxId
            FROM stock_transactions
            WHERE flag = 1 AND transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION', 'Damaged', 'Disposal')
            GROUP BY itemId
        ) st2 ON st1.transactionId = st2.maxId
    ) adj ON i.itemId = adj.itemId
`;

// Helper to append adjustment status filter if provided
const applyAdjustmentFilter = (query, adjustmentType, params) => {
    if (!adjustmentType) return query;
    if (adjustmentType === 'DAMAGED') {
        params.push('DAMAGED', 'Damaged');
        return query + ` AND (adj.adjustmentType IN (?, ?))`;
    } else if (adjustmentType === 'DISPOSAL') {
        params.push('DISPOSAL', 'Disposal');
        return query + ` AND (adj.adjustmentType IN (?, ?))`;
    } else if (adjustmentType === 'GOOD') {
        return query + ` AND (adj.adjustmentType IS NULL OR adj.adjustmentType NOT IN ('DAMAGED', 'DISPOSAL', 'Damaged', 'Disposal'))`;
    }
    return query;
};

// 2. COMPLETE INVENTORY REPORT
router.get("/complete", (req, res) => {
  let query = getBaseItemQuery() + ` WHERE i.flag = 1 ORDER BY i.createdDate DESC`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
});

// 3. LOW STOCK REPORT
router.get("/low-stock", (req, res) => {
    let query = getBaseItemQuery() + ` WHERE i.flag = 1 AND i.quantity <= 5 ORDER BY i.quantity ASC`;
    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 4. MONTHLY INVENTORY REPORT (items based on month/year)
router.get("/monthly", (req, res) => {
    const { month, year, adjustmentType } = req.query;
    let base = getBaseItemQuery();
    let query = base + ` WHERE i.flag = 1`;
    const params = [];
    if (month) {
        query += ` AND MONTH(i.purchaseDate) = ?`;
        params.push(month);
    }
    if (year) {
        query += ` AND YEAR(i.purchaseDate) = ?`;
        params.push(year);
    }
    query = applyAdjustmentFilter(query, adjustmentType, params);
    query += ` ORDER BY i.purchaseDate DESC`;
    
    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 5. YEARLY INVENTORY REPORT
router.get("/yearly", (req, res) => {
    const { year, adjustmentType } = req.query;
    let base = getBaseItemQuery();
    let query = base + ` WHERE i.flag = 1`;
    const params = [];
    if (year) {
        query += ` AND YEAR(i.purchaseDate) = ?`;
        params.push(year);
    }
    query = applyAdjustmentFilter(query, adjustmentType, params);
    query += ` ORDER BY i.purchaseDate DESC`;
    
    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 6. ITEM WISE REPORT
router.get("/item-wise", (req, res) => {
    const { query: searchQuery, adjustmentType } = req.query;
    let base = getBaseItemQuery();
    let dbQuery = base + ` WHERE i.flag = 1`;
    const params = [];
    if (searchQuery) {
        dbQuery += ` AND (i.itemCode LIKE ? OR i.itemName LIKE ? OR t.itemTypeName LIKE ? OR m.mainCategoryName LIKE ? OR s.subCategoryName LIKE ?)`;
        const wildCard = '%' + searchQuery + '%';
        params.push(wildCard, wildCard, wildCard, wildCard, wildCard);
    }
    dbQuery = applyAdjustmentFilter(dbQuery, adjustmentType, params);
    dbQuery += ` ORDER BY i.createdDate DESC`;
    
    db.query(dbQuery, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 7. DIVISION WISE REPORT
router.get("/division-wise", (req, res) => {
    const { divisionId, adjustmentType } = req.query;
    let base = getBaseItemQuery();
    let query = base + ` WHERE i.flag = 1`;
    const params = [];
    if (divisionId) {
        query += ` AND i.divisionId = ?`;
        params.push(divisionId);
    }
    query = applyAdjustmentFilter(query, adjustmentType, params);
    query += ` ORDER BY d.description ASC`;
    
    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 8. SECTION WISE REPORT
router.get("/section-wise", (req, res) => {
    const { sectionId, divisionId, adjustmentType } = req.query;
    let base = getBaseItemQuery();
    let query = base + ` WHERE i.flag = 1`;
    const params = [];
    if (sectionId) {
        query += ` AND i.sectionId = ?`;
        params.push(sectionId);
    }
    if (divisionId) {
      query += ` AND i.divisionId = ?`;
      params.push(divisionId);
    }
    query = applyAdjustmentFilter(query, adjustmentType, params);
    query += ` ORDER BY sec.sectionname ASC`;
    
    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 9. SUPPLIER REPORT
router.get("/supplier", (req, res) => {
    // Get suppliers and calculate totals based on their invoices
    const query = `
        SELECT s.*, 
            COUNT(i.invoiceId) as totalInvoices,
            COALESCE(SUM(i.totalAmount), 0) as totalValue
        FROM suppliers s
        LEFT JOIN invoices i ON s.supplierId = i.supplierId AND i.flag = 1
        WHERE s.flag = 1
        GROUP BY s.supplierId
        ORDER BY s.supplierName ASC
    `;
    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});

// 10. INVOICE REPORT
router.get("/invoice", (req, res) => {
    const { startDate, endDate, supplierId, invoiceNumber } = req.query;
    let query = `
      SELECT i.*, s.supplierName 
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplierId = s.supplierId
      WHERE i.flag=1
    `;
    const params = [];
    if (startDate && endDate) {
      query += ` AND i.invoiceDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (supplierId) {
      query += ` AND i.supplierId = ?`;
      params.push(supplierId);
    }
    if (invoiceNumber) {
      query += ` AND i.invoiceNumber LIKE ?`;
      params.push('%' + invoiceNumber + '%');
    }
    query += ` ORDER BY i.invoiceDate DESC`;
    
    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: result });
    });
});


// 11. STOCK TRANSACTION REPORT
router.get("/stock-transactions", (req, res) => {
    const { startDate, endDate, type } = req.query;
    let query = `
        SELECT st.*, 
               ii.itemCode, ii.itemName, ii.serialNumber, 
               u.uFullName as handledByName
        FROM stock_transactions st
        LEFT JOIN inventory_items ii ON st.itemId = ii.itemId
        LEFT JOIN users u ON st.handledBy = u.uId
        WHERE 1=1
    `;
    const params = [];
    
    if (startDate && endDate) {
        query += ` AND DATE(st.transactionDate) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }
    if (type) {
        query += ` AND st.transactionType = ?`;
        params.push(type);
    }
    query += ` ORDER BY st.transactionDate DESC`;
    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
});

// 12. STOCK ADJUSTMENTS REPORT
router.get("/stock-adjustments", (req, res) => {
    const { startDate, endDate, type, divisionId } = req.query;
    let query = `
        SELECT st.transactionId as adjustmentId, st.itemId, st.transactionType as adjustmentType, 
               st.quantity, st.transactionDate as adjustmentDate, st.remarks, st.createdBy,
               ii.itemName, ii.itemCode, ii.serialNumber, 
               d.description as divisionName, sec.sectionname as sectionName,
               sup.supplierName
        FROM stock_transactions st
        LEFT JOIN inventory_items ii ON st.itemId = ii.itemId
        LEFT JOIN divisions d ON ii.divisionId = d.division_id
        LEFT JOIN sections sec ON ii.sectionId = sec.sectionid
        LEFT JOIN invoices inv ON ii.invoiceId = inv.invoiceId
        LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
        WHERE st.flag = 1 AND st.transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION', 'Stock In', 'Stock Out', 'Transfer', 'Return', 'Damaged', 'Disposal')
    `;
    const params = [];
    
    if (startDate && endDate) {
        query += ` AND DATE(st.transactionDate) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }
    if (type) {
        query += ` AND st.transactionType = ?`;
        params.push(type);
    }
    if (divisionId) {
        query += ` AND ii.divisionId = ?`;
        params.push(divisionId);
    }
    query += ` ORDER BY st.transactionDate DESC`;
    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
});

module.exports = router;
