const StockTransactionModel = require("../models/stockTransactionModel");

const StockTransactionController = {
  getAllTransactions: (req, res) => {
    StockTransactionModel.getAll((err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: results });
    });
  },

  getTransactionById: (req, res) => {
    const { id } = req.params;
    StockTransactionModel.getById(id, (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (results.length === 0) return res.status(404).json({ success: false, message: "Transaction not found" });
      res.json({ success: true, data: results[0] });
    });
  },

  createTransaction: (req, res) => {
    const {
      itemId, transactionType, quantity, transactionDate, 
      fromDivisionId, toDivisionId, remarks
    } = req.body;

    // Optional validation
    if (!itemId || !transactionType || !quantity) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const data = {
      itemId, transactionType, quantity, transactionDate,
      fromDivisionId, toDivisionId, remarks,
      createdBy: req.userId 
    };

    StockTransactionModel.create(data, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.status(201).json({ success: true, message: "Stock transaction created successfully!" });
    });
  },

  updateTransaction: (req, res) => {
    const { id } = req.params;
    const {
      itemId, transactionType, quantity, transactionDate, 
      fromDivisionId, toDivisionId, remarks
    } = req.body;

    const data = {
      itemId, transactionType, quantity, transactionDate,
      fromDivisionId, toDivisionId, remarks,
      updatedBy: req.userId
    };

    StockTransactionModel.update(id, data, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Stock transaction updated successfully!" });
    });
  },

  deleteTransaction: (req, res) => {
    const { id } = req.params;
    
    StockTransactionModel.softDelete(id, req.userId, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Stock transaction deleted successfully!" });
    });
  }
};

module.exports = StockTransactionController;
