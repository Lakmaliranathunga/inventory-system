const db = require('./db');

['item_types', 'main_categories', 'sub_categories'].forEach(table => {
  db.query(`SHOW COLUMNS FROM ${table}`, (err, result) => {
    if (err) console.error(err);
    else console.log(`\n--- ${table} ---`, result);
  });
});
setTimeout(() => process.exit(), 2000);
