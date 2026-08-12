const express = require("express");
const router = express.Router();
const stockAdjustmentController = require("../controllers/stockAdjustmentController");

router.get("/", stockAdjustmentController.getAllAdjustments);
router.get("/:id", stockAdjustmentController.getAdjustmentById);
router.post("/", stockAdjustmentController.createAdjustment);
router.put("/:id", stockAdjustmentController.updateAdjustment);
router.delete("/:id", stockAdjustmentController.deleteAdjustment);

module.exports = router;
