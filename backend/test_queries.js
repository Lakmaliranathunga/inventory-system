const db = require("./db");
const sql = `
  SELECT st.transactionId as adjustmentId, st.itemId, st.transactionType as adjustmentType, 
         st.quantity, st.transactionDate as adjustmentDate, st.remarks, st.createdBy, st.createdDate,
         i.itemName, i.itemCode, i.serialNumber
  FROM stock_transactions st
  LEFT JOIN inventory_items i ON st.itemId = i.itemId
  WHERE st.flag = 1 AND st.transactionType IN ('DAMAGED', 'DISPOSAL', 'CORRECTION')
  ORDER BY st.transactionDate DESC
`;
db.query(sql, (err, res) => {
  if (err) console.error("Error from stock_transactions:", err.message);
  else console.log("stock_transactions query SUCCESS");
  
  const sql2 = `SELECT * FROM inventory_items LIMIT 1`;
  db.query(sql2, (err2, res2) => {
    if (err2) console.error("Error from inventory_items:", err2.message);
    else console.log("inventory_items query SUCCESS");
    process.exit(0);
  });
});
