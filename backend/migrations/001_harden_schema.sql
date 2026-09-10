-- Back up the database before applying schema migrations.
-- The first two indexes were applied to the current development database on 2026-09-09.
ALTER TABLE inventory_items ADD UNIQUE INDEX ux_inventory_item_code (itemCode);
ALTER TABLE invoices ADD UNIQUE INDEX ux_invoice_number (invoiceNumber);

-- Run scripts/check-integrity.js and resolve duplicate active usernames before enabling this index.
-- MySQL permits multiple NULL values, so deleted usernames can remain in audit history.
ALTER TABLE users
  ADD COLUMN activeUsername VARCHAR(100)
    GENERATED ALWAYS AS (CASE WHEN flag = 1 AND uStatus = 'Active' THEN LOWER(uUsername) ELSE NULL END) STORED,
  ADD UNIQUE INDEX ux_users_active_username (activeUsername);

-- Add relationship constraints only after all historical orphan rows have been reconciled.
ALTER TABLE invoices
  ADD CONSTRAINT fk_invoice_supplier FOREIGN KEY (supplierId) REFERENCES suppliers(supplierId);
ALTER TABLE inventory_items
  ADD CONSTRAINT fk_inventory_invoice FOREIGN KEY (invoiceId) REFERENCES invoices(invoiceId),
  ADD CONSTRAINT fk_inventory_item_type FOREIGN KEY (itemTypeId) REFERENCES item_types(itemTypeId),
  ADD CONSTRAINT fk_inventory_main_category FOREIGN KEY (mainCategoryId) REFERENCES main_categories(mainCategoryId),
  ADD CONSTRAINT fk_inventory_sub_category FOREIGN KEY (subCategoryId) REFERENCES sub_categories(subCategoryId);
