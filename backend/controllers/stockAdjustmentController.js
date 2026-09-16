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
    if (![1, 3, 4].includes(Number(req.userRole))) {
      return res.status(403).json({ success: false, message: "This account has read-only access." });
    }
    const { itemId, adjustmentType, quantity, adjustmentDate, remarks } = req.body;

    const normalizedType = String(adjustmentType || '').toUpperCase();
    if (!itemId || !['DAMAGED', 'DISPOSAL', 'CORRECTION'].includes(normalizedType) || Number(quantity) !== 1 || !String(remarks || '').trim()) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const data = {
      itemId, adjustmentType: normalizedType, quantity: 1, adjustmentDate, remarks: String(remarks).trim(),
      createdBy: req.userId 
    };

    StockAdjustmentModel.create(data, (err) => {
      if (err) {
        console.error('Unable to create stock adjustment:', err.message || err);
        return res.status(500).json({ success: false, message: "Unable to save adjustment." });
      }
      StockAdjustmentModel.syncItemCondition(itemId, (syncErr) => {
        if (syncErr) {
          console.error('Unable to synchronize item condition:', syncErr.message || syncErr);
          return res.status(500).json({ success: false, message: "Adjustment saved, but item condition could not be synchronized." });
        }
        res.status(201).json({ success: true, message: "Stock adjustment created successfully!" });
      });
    });
  },

  updateAdjustment: (req, res) => {
    if (![1, 3, 4].includes(Number(req.userRole))) {
      return res.status(403).json({ success: false, message: "This account has read-only access." });
    }
    const { id } = req.params;
    const { itemId, adjustmentType, quantity, adjustmentDate, remarks } = req.body;
    const normalizedType = String(adjustmentType || '').toUpperCase();
    if (!itemId || !['DAMAGED', 'DISPOSAL', 'CORRECTION'].includes(normalizedType) || Number(quantity) !== 1 || !String(remarks || '').trim()) {
      return res.status(400).json({ success: false, message: "A valid item, type, date, and reason are required." });
    }

    const data = {
      itemId, adjustmentType: normalizedType, quantity: 1, adjustmentDate, remarks: String(remarks).trim(),
      updatedBy: req.userId
    };

    StockAdjustmentModel.getById(id, (lookupErr, previous) => {
      if (lookupErr) return res.status(500).json({ success: false, message: "Unable to load adjustment." });
      if (!previous.length) return res.status(404).json({ success: false, message: "Adjustment not found." });
      StockAdjustmentModel.update(id, data, (err) => {
        if (err) return res.status(500).json({ success: false, message: "Unable to update adjustment." });
        const affectedItems = [...new Set([previous[0].itemId, itemId])];
        let remaining = affectedItems.length;
        let failed = false;
        affectedItems.forEach((affectedItemId) => {
          StockAdjustmentModel.syncItemCondition(affectedItemId, (syncErr) => {
            failed = failed || Boolean(syncErr);
            remaining -= 1;
            if (remaining === 0) {
              if (failed) return res.status(500).json({ success: false, message: "Adjustment updated, but item condition could not be synchronized." });
              res.json({ success: true, message: "Stock adjustment updated successfully!" });
            }
          });
        });
      });
    });
  },

  deleteAdjustment: (req, res) => {
    if (![1, 3, 4].includes(Number(req.userRole))) {
      return res.status(403).json({ success: false, message: "This account has read-only access." });
    }
    const { id } = req.params;
    StockAdjustmentModel.getById(id, (lookupErr, previous) => {
      if (lookupErr) return res.status(500).json({ success: false, message: "Unable to load adjustment." });
      if (!previous.length) return res.status(404).json({ success: false, message: "Adjustment not found." });
      StockAdjustmentModel.softDelete(id, req.userId, (err) => {
        if (err) return res.status(500).json({ success: false, message: "Unable to delete adjustment." });
        StockAdjustmentModel.syncItemCondition(previous[0].itemId, (syncErr) => {
          if (syncErr) return res.status(500).json({ success: false, message: "Adjustment deleted, but item condition could not be synchronized." });
          res.json({ success: true, message: "Stock adjustment deleted successfully!" });
        });
      });
    });
  }
};

module.exports = StockAdjustmentController;
