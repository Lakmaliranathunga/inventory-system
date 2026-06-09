const express = require("express");
const router = express.Router();
const stockTransactionController = require("../controllers/stockTransactionController");

// Assuming `verifyToken` middleware will be handled in server.js or we could import it here.
// In the current setup, `server.js` mounts routes like: app.use('/api', verifyToken, router)
// But I will apply middleware dynamically at mount point.

router.get("/", stockTransactionController.getAllTransactions);
router.get("/:id", stockTransactionController.getTransactionById);
router.post("/", stockTransactionController.createTransaction);
router.put("/:id", stockTransactionController.updateTransaction);
router.delete("/:id", stockTransactionController.deleteTransaction);

module.exports = router;
