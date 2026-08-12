const StockAdjustmentModel = require("../models/stockAdjustmentModel");

const StockAdjustmentController = {
  getAllAdjustments: (req, res) => {
    StockAdjustmentModel.getAll((err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: results });
    });
  },

  getAdjustmentById: (req, res) => {
    const { id } = req.params;
    StockAdjustmentModel.getById(id, (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (results.length === 0) return res.status(404).json({ success: false, message: "Adjustment not found" });
      res.json({ success: true, data: results[0] });
    });
  },

  createAdjustment: (req, res) => {
    const { itemId, adjustmentType, quantity, adjustmentDate, remarks } = req.body;

    if (!itemId || !adjustmentType || !quantity) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const data = {
      itemId, adjustmentType, quantity, adjustmentDate, remarks,
      createdBy: req.userId 
    };

    StockAdjustmentModel.create(data, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.status(201).json({ success: true, message: "Stock adjustment created successfully!" });
    });
  },

  updateAdjustment: (req, res) => {
    const { id } = req.params;
    const { itemId, adjustmentType, quantity, adjustmentDate, remarks } = req.body;

    const data = {
      itemId, adjustmentType, quantity, adjustmentDate, remarks,
      updatedBy: req.userId
    };

    StockAdjustmentModel.update(id, data, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Stock adjustment updated successfully!" });
    });
  },

  deleteAdjustment: (req, res) => {
    const { id } = req.params;
    StockAdjustmentModel.softDelete(id, req.userId, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Stock adjustment deleted successfully!" });
    });
  }
};

module.exports = StockAdjustmentController;
