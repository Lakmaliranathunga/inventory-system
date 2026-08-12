const db = require("./db");
const sql = `
  SELECT st.transactionId as adjustmentId, st.itemId, st.transactionType as adjustmentType, 
         st.quantity, st.transactionDate as adjustmentDate, st.remarks, st.createdBy,
         i.itemName, i.itemCode, i.serialNumber
  FROM stock_transactions st
  LEFT JOIN inventory_items i ON st.itemId = i.itemId
  WHERE st.flag = 1 AND st.transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION')
  ORDER BY st.transactionDate DESC
  LIMIT 1
`;
db.query(sql, (err, res) => {
  if (err) console.error("Error from stock_transactions:", err.message);
  else console.log("stock_transactions query SUCCESS");
  process.exit(0);
});
