const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const StockAdjustmentModel = require("./models/stockAdjustmentModel");

const app = express();

const JWT_SECRET = "slpa_inventory_secret_key_2026";

app.use(cors());
app.use(express.json());


// TEST API
app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});


// REGISTER API
app.post("/register", async (req, res) => {

  const {
    uUsername,
    uFullName,
    uPassword,
    uStatus,
    uEmpNo,
    roleId,
    sectionId,
    divisionId,
    contactNo
  } = req.body;

  try {

    // PASSWORD ENCRYPT
    const hashedPassword = await bcrypt.hash(uPassword, 10);

    const sql = `
      INSERT INTO users
      (
        uUsername,
        uFullName,
        uPassword,
        uStatus,
        uEmpNo,
        roleId,
        sectionId,
        divisionId,
        contactNo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        uUsername,
        uFullName,
        hashedPassword,
        uStatus,
        uEmpNo,
        roleId,
        sectionId,
        divisionId,
        contactNo
      ],
      (err, result) => {

        if (err) {

          console.log(err);

          res.status(500).json({
            success: false,
            message: "Database Error"
          });

        } else {

          res.json({
            success: true,
            message: "User Registered Successfully"
          });

        }

      }
    );

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

});


// LOGIN API
app.post("/login", (req, res) => {

  const { uUsername, uPassword } = req.body;

  const sql = `
    SELECT * FROM users
    WHERE uUsername = ?
  `;

  db.query(sql, [uUsername], async (err, result) => {

    if (err) {

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });

    }

    if (result.length === 0) {

      return res.status(401).json({
        success: false,
        message: "Invalid Username"
      });

    }

    const user = result[0];

    const match = await bcrypt.compare(
      uPassword,
      user.uPassword
    );

    if (match) {

      const token = jwt.sign(
        { id: user.uId, username: user.uUsername, roleId: user.roleId },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        success: true,
        message: "Login Success",
        token: token,
        user: {
          id: user.uId,
          username: user.uUsername,
          fullName: user.uFullName,
          roleId: user.roleId
        }
      });

    } else {

      res.status(401).json({
        success: false,
        message: "Wrong Password"
      });

    }

  });

});


// GET DIVISIONS
app.get("/divisions", (req, res) => {

  const sql = "SELECT division_id AS divisionId, description AS divisionName FROM divisions";

  db.query(sql, (err, result) => {

    if (err) {

      res.status(500).send(err);

    } else {

      res.json(result);

    }

  });

});


// GET SECTIONS
app.get("/sections", (req, res) => {

  const sql = "SELECT sectionid AS sectionId, sectionname AS sectionName, division_id AS divisionId FROM sections";

  db.query(sql, (err, result) => {

    if (err) {

      res.status(500).send(err);

    } else {

      res.json(result);

    }

  });

});


// GET ROLES
app.get("/roles", (req, res) => {
  const sql = "SELECT roleId, roleName FROM user_roles";
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
});



// MIDDLEWARE: VERIFY TOKEN
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ success: false, message: "No token provided" });

  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Unauthorized!" });
    req.userId = decoded.id;
    req.userRole = decoded.roleId;
    next();
  });
};

// DASHBOARD STATS API
app.get("/api/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const usersCount = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM users", (err, result) => err ? reject(err) : resolve(result[0].count));
    });
    const itemsCount = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM inventory_items", (err, result) => err ? reject(err) : resolve(result[0].count));
    });
    const suppliersCount = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM suppliers", (err, result) => err ? reject(err) : resolve(result[0].count));
    });
    const invoicesCount = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM invoices", (err, result) => err ? reject(err) : resolve(result[0].count));
    });

    const stockStats = await new Promise((resolve, reject) => {
      StockAdjustmentModel.getDashboardStats((err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });

    res.json({
      success: true,
      stats: {
        users: usersCount,
        items: itemsCount,
        suppliers: suppliersCount,
        invoices: invoicesCount,
        stockIn: stockStats.totalIn || 0,
        stockOut: stockStats.totalOut || 0,
        stockTransfer: stockStats.totalTransfer || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// =========================
// STOCK ADJUSTMENTS (MVC)
// =========================
const stockAdjustmentRoutes = require("./routes/stockAdjustmentRoutes");
app.use("/api/stock-adjustments", verifyToken, stockAdjustmentRoutes);

// =========================
// REPORTS APIs
// =========================
const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", verifyToken, reportRoutes);

// =========================
// CATEGORIES APIs
// =========================
app.get("/api/categories/item-types", verifyToken, (req, res) => {
  db.query("SELECT * FROM item_types WHERE flag=1 ORDER BY createdDate DESC", (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
});

app.post("/api/categories/item-types", verifyToken, (req, res) => {
  const { name, remarks } = req.body;
  const sql = `INSERT INTO item_types (itemTypeName, remarks, createdBy) VALUES (?, ?, ?)`;
  db.query(sql, [name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item type added!" });
  });
});

app.put("/api/categories/item-types/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, remarks } = req.body;
  const sql = `UPDATE item_types SET itemTypeName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE itemTypeId=?`;
  db.query(sql, [name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item type updated!" });
  });
});

app.delete("/api/categories/item-types/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE item_types SET flag=0, deletedBy=?, deletedDate=NOW() WHERE itemTypeId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item type deleted!" });
  });
});

app.get("/api/categories/main-categories", verifyToken, (req, res) => {
  const sql = `
    SELECT m.*, i.itemTypeName 
    FROM main_categories m
    LEFT JOIN item_types i ON m.itemTypeId = i.itemTypeId
    WHERE m.flag=1 ORDER BY m.createdDate DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
});

app.post("/api/categories/main-categories", verifyToken, (req, res) => {
  const { itemTypeId, name, remarks } = req.body;
  const sql = `INSERT INTO main_categories (itemTypeId, mainCategoryName, remarks, createdBy) VALUES (?, ?, ?, ?)`;
  db.query(sql, [itemTypeId, name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Main category added!" });
  });
});

app.put("/api/categories/main-categories/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { itemTypeId, name, remarks } = req.body;
  const sql = `UPDATE main_categories SET itemTypeId=?, mainCategoryName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE mainCategoryId=?`;
  db.query(sql, [itemTypeId, name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Main category updated!" });
  });
});

app.delete("/api/categories/main-categories/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE main_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE mainCategoryId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Main category deleted!" });
  });
});

app.get("/api/categories/sub-categories", verifyToken, (req, res) => {
  const sql = `
    SELECT s.*, m.mainCategoryName, i.itemTypeName 
    FROM sub_categories s
    LEFT JOIN main_categories m ON s.mainCategoryId = m.mainCategoryId
    LEFT JOIN item_types i ON m.itemTypeId = i.itemTypeId
    WHERE s.flag=1 ORDER BY s.createdDate DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
});

app.post("/api/categories/sub-categories", verifyToken, (req, res) => {
  const { mainCategoryId, name, remarks } = req.body;
  const sql = `INSERT INTO sub_categories (mainCategoryId, subCategoryName, remarks, createdBy) VALUES (?, ?, ?, ?)`;
  db.query(sql, [mainCategoryId, name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Sub category added!" });
  });
});

app.put("/api/categories/sub-categories/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { mainCategoryId, name, remarks } = req.body;
  const sql = `UPDATE sub_categories SET mainCategoryId=?, subCategoryName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE subCategoryId=?`;
  db.query(sql, [mainCategoryId, name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Sub category updated!" });
  });
});

app.delete("/api/categories/sub-categories/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE sub_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE subCategoryId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Sub category deleted!" });
  });
});

// =========================
// SUPPLIERS APIs
// =========================
app.get("/api/suppliers", verifyToken, (req, res) => {
  db.query("SELECT * FROM suppliers WHERE flag=1 ORDER BY createdDate DESC", (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, suppliers: result });
  });
});

app.post("/api/suppliers", verifyToken, (req, res) => {
  const { name, contactPerson, contactNo, email, address, remarks } = req.body;
  const sql = `INSERT INTO suppliers (supplierName, contactPerson, contactNo, email, address, remarks, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, contactPerson, contactNo, email, address, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Supplier added successfully!" });
  });
});

app.put("/api/suppliers/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, contactNo, email, address, remarks } = req.body;
  const sql = `UPDATE suppliers SET supplierName=?, contactPerson=?, contactNo=?, email=?, address=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE supplierId=?`;
  db.query(sql, [name, contactPerson, contactNo, email, address, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Supplier updated successfully!" });
  });
});

app.delete("/api/suppliers/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE suppliers SET flag=0, deletedBy=?, deletedDate=NOW() WHERE supplierId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Supplier deleted successfully!" });
  });
});

app.get("/api/suppliers/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM suppliers WHERE supplierId=? AND flag=1", [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.length === 0) return res.status(404).json({ success: false, message: "Supplier not found" });
    res.json(result[0]);
  });
});

// =========================
// INVENTORY APIs
// =========================
app.get("/api/inventory", verifyToken, (req, res) => {
  const sql = `
    SELECT i.*, 
           t.itemTypeName, 
           m.mainCategoryName, 
           s.subCategoryName,
           d.description as divisionName,
           sec.sectionname as sectionName,
           inv.invoiceNumber,
           sup.supplierName
    FROM inventory_items i
    LEFT JOIN item_types t ON i.itemTypeId = t.itemTypeId
    LEFT JOIN main_categories m ON i.mainCategoryId = m.mainCategoryId
    LEFT JOIN sub_categories s ON i.subCategoryId = s.subCategoryId
    LEFT JOIN divisions d ON i.divisionId = d.division_id
    LEFT JOIN sections sec ON i.sectionId = sec.sectionid
    LEFT JOIN invoices inv ON i.invoiceId = inv.invoiceId
    LEFT JOIN suppliers sup ON inv.supplierId = sup.supplierId
    WHERE i.flag = 1 
    ORDER BY i.createdDate DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, items: result });
  });
});

app.post("/api/inventory", verifyToken, async (req, res) => {
  let {
    itemTypeId, mainCategoryId,
    subCategoryId, divisionId, sectionId, quantity, itemCondition,
    purchaseDate, warrantyExpireDate, remarks, serialNumber, invoiceId
  } = req.body;

  try {
    const itemTypeRes = await new Promise((resolve, reject) => {
      db.query("SELECT itemTypeName FROM item_types WHERE itemTypeId=?", [itemTypeId || 0], (err, r) => err ? reject(err) : resolve(r));
    });
    const mainCatRes = await new Promise((resolve, reject) => {
      db.query("SELECT mainCategoryName FROM main_categories WHERE mainCategoryId=?", [mainCategoryId || 0], (err, r) => err ? reject(err) : resolve(r));
    });
    const subCatRes = await new Promise((resolve, reject) => {
      db.query("SELECT subCategoryName FROM sub_categories WHERE subCategoryId=?", [subCategoryId || 0], (err, r) => err ? reject(err) : resolve(r));
    });
    const divRes = await new Promise((resolve, reject) => {
      db.query("SELECT description FROM divisions WHERE division_id=?", [divisionId || 0], (err, r) => err ? reject(err) : resolve(r));
    });

    const getDivShortForm = (text, defaultVal = 'DIV') => {
      if (!text) return defaultVal;
      const words = text.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      if (words.length === 0) return defaultVal;
      return words.map(w => w[0]).join('');
    };

    const getShortForm = (text, defaultVal = 'GEN') => {
      if (!text) return defaultVal;
      const clean = text.trim().toUpperCase();
      const words = clean.replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      if (words.length >= 3) {
        return words.map(w => w[0]).join('').substring(0, 4);
      } else if (words.length === 2) {
        if (words[1] === 'DIVISION' || words[1] === 'DEPARTMENT') {
          return words[0].substring(0, 3);
        }
        return (words[0][0] + words[1].substring(0, 2)).substring(0, 3);
      }
      return clean.substring(0, 3);
    };

    const divName = divRes[0]?.description || '';
    const divCode = getDivShortForm(divName, 'DIV');
    const itemTypeCode = getShortForm(itemTypeRes[0]?.itemTypeName || '', 'GEN');
    const mainCatCode = getShortForm(mainCatRes[0]?.mainCategoryName || '', 'GEN');
    const subCategoryName = subCatRes[0]?.subCategoryName || 'Unknown';
    const subCatCode = getShortForm(subCategoryName, 'GEN');
    const year = new Date().getFullYear();
    const itemName = subCategoryName;

    const countRes = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as cnt FROM inventory_items WHERE itemName=? AND subCategoryId=?", [itemName, subCategoryId || 0], (err, r) => err ? reject(err) : resolve(r));
    });

    let currentCount = countRes[0].cnt;
    let qtyNum = parseInt(quantity) || 1;
    let totalQty = currentCount + qtyNum;

    for (let i = 1; i <= qtyNum; i++) {
        const itemNumber = currentCount + i;
        const generatedItemCode = `${divCode}/${itemTypeCode}/${mainCatCode}/${subCatCode}/${year}/${itemNumber}/${totalQty}`;

        const sql = `
          INSERT INTO inventory_items (
            itemCode, itemName, serialNumber, itemTypeId, mainCategoryId, 
            subCategoryId, divisionId, sectionId, quantity, itemCondition, 
            purchaseDate, warrantyExpireDate, remarks, invoiceId, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          generatedItemCode, itemName, (qtyNum === 1 ? serialNumber || null : null), itemTypeId, mainCategoryId,
          subCategoryId, divisionId, sectionId, 1, itemCondition,
          purchaseDate, warrantyExpireDate, remarks, invoiceId || null, req.userId
        ];
        
        await new Promise((resolve, reject) => {
          db.query(sql, values, (err, r) => err ? reject(err) : resolve(r));
        });
    }

    res.json({ success: true, message: "Item(s) added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
});

app.put("/api/inventory/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    itemTypeId, mainCategoryId,
    subCategoryId, divisionId, sectionId, itemCondition,
    purchaseDate, warrantyExpireDate, remarks, serialNumber, invoiceId
  } = req.body;

  try {
    const subCatRes = await new Promise((resolve, reject) => {
      db.query("SELECT subCategoryName FROM sub_categories WHERE subCategoryId=?", [subCategoryId || 0], (err, r) => err ? reject(err) : resolve(r));
    });
    const itemName = subCatRes[0]?.subCategoryName || 'Unknown';

    const sql = `
      UPDATE inventory_items SET 
        itemName=?, serialNumber=?, itemTypeId=?, mainCategoryId=?, 
        subCategoryId=?, divisionId=?, sectionId=?, itemCondition=?, 
        purchaseDate=?, warrantyExpireDate=?, remarks=?, invoiceId=?, updatedBy=?, updatedDate=NOW()
      WHERE itemId=?
    `;
    const values = [
      itemName, serialNumber || null, itemTypeId, mainCategoryId,
      subCategoryId, divisionId, sectionId, itemCondition,
      purchaseDate, warrantyExpireDate, remarks, invoiceId || null, req.userId, id
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Item updated successfully!" });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

app.delete("/api/inventory/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE inventory_items SET flag=0, deletedBy=?, deletedDate=NOW() WHERE itemId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item deleted successfully!" });
  });
});

// =========================
// INVOICES APIs
// =========================
app.get("/api/invoices", verifyToken, (req, res) => {
  const sql = `
    SELECT i.*, s.supplierName, s.address, s.contactNo, s.contactPerson, s.email
    FROM invoices i
    LEFT JOIN suppliers s ON i.supplierId = s.supplierId
    WHERE i.flag=1 
    ORDER BY i.createdDate DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, invoices: result });
  });
});

app.post("/api/invoices", verifyToken, (req, res) => {
  const { invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks } = req.body;
  const sql = `INSERT INTO invoices (invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Invoice added successfully!" });
  });
});

app.put("/api/invoices/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks } = req.body;
  const sql = `UPDATE invoices SET invoiceNumber=?, supplierId=?, poNo=?, poDate=?, invoiceDate=?, totalAmount=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE invoiceId=?`;
  db.query(sql, [invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Invoice updated successfully!" });
  });
});

app.delete("/api/invoices/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE invoices SET flag=0, deletedBy=?, deletedDate=NOW() WHERE invoiceId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Invoice deleted successfully!" });
  });
});

// SERVER
app.listen(5000, () => {
  console.log("Server Running On Port 5000");
});