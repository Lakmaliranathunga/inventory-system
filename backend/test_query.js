const db = require('c:/Users/LapMart.LK/Desktop/inventory-system/backend/db.js');

const sql = `
  SELECT i.*, 
         t.itemTypeName, 
         m.mainCategoryName, 
         s.subCategoryName,
         d.description as divisionName,
         sec.sectionname as sectionName
  FROM inventory_items i
  LEFT JOIN item_types t ON i.itemTypeId = t.itemTypeId
  LEFT JOIN main_categories m ON i.mainCategoryId = m.mainCategoryId
  LEFT JOIN sub_categories s ON i.subCategoryId = s.subCategoryId
  LEFT JOIN divisions d ON i.divisionId = d.division_id
  LEFT JOIN sections sec ON i.sectionId = sec.sectionid
  WHERE i.flag = 1 
  ORDER BY i.createdDate DESC
`;

db.query(sql, (err, result) => {
  if (err) {
    console.error("QUERY ERROR:");
    console.error(err);
  } else {
    console.log("QUERY SUCCESS, rows:", result.length);
  }
  process.exit();
});
