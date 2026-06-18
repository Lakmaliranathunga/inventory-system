const db = require("./db");

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
  ORDER BY st.transactionDate DESC, st.createdDate DESC
`;

db.query(sql, (err, results) => {
  if (err) {
    console.error("SQL Error in Stock Transactions Model:", err);
  } else {
    console.log("SQL Results:", results.length);
  }
  process.exit();
});

