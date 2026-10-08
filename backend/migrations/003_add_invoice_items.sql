CREATE TABLE IF NOT EXISTS invoice_items (
  invoiceItemId INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,
  subCategoryId INT NOT NULL,
  quantity INT NOT NULL,
  createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedDate TIMESTAMP NULL DEFAULT NULL,
  deletedDate TIMESTAMP NULL DEFAULT NULL,
  createdBy VARCHAR(100) NULL,
  updatedBy VARCHAR(100) NULL,
  deletedBy VARCHAR(100) NULL,
  flag INT DEFAULT 1,
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoiceId) REFERENCES invoices(invoiceId),
  CONSTRAINT fk_invoice_items_sub_category FOREIGN KEY (subCategoryId) REFERENCES sub_categories(subCategoryId)
);
