const db = require('../db');

const checks = {
  duplicateActiveUsernames: "SELECT LOWER(uUsername) AS value, COUNT(*) AS count FROM users WHERE flag=1 AND uStatus='Active' GROUP BY LOWER(uUsername) HAVING COUNT(*)>1",
  duplicateItemCodes: "SELECT itemCode AS value, COUNT(*) AS count FROM inventory_items GROUP BY itemCode HAVING COUNT(*)>1",
  duplicateInvoiceNumbers: "SELECT invoiceNumber AS value, COUNT(*) AS count FROM invoices GROUP BY invoiceNumber HAVING COUNT(*)>1",
  orphanInventoryInvoices: "SELECT itemId AS value FROM inventory_items i WHERE invoiceId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM invoices x WHERE x.invoiceId=i.invoiceId)",
};

(async () => {
  let failed = false;
  for (const [name, sql] of Object.entries(checks)) {
    const [rows] = await db.promise().query(sql);
    console.log(`${name}: ${rows.length}`);
    failed ||= rows.length > 0;
  }
  await db.promise().end();
  process.exitCode = failed ? 1 : 0;
})().catch(async (error) => {
  console.error(error.message);
  await db.promise().end();
  process.exitCode = 1;
});
