const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const StockAdjustmentModel = require("./models/stockAdjustmentModel");
const fs = require("fs");
const { port, jwtSecret, jwtExpiresIn, allowedOrigins, maxUploadBytes } = require('./config');

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

const app = express();

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500 && body && typeof body === 'object' && body.error) {
      console.error(body.error.message || body.error);
      const safeBody = { ...body, message: body.message || 'Internal server error.' };
      delete safeBody.error;
      return sendJson(safeBody);
    }
    return sendJson(body);
  };
  next();
});

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const allowedUploadTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const upload = multer({
  storage,
  limits: { fileSize: maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    if (!allowedUploadTypes.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP, and PDF invoice files are allowed.'));
    }
    cb(null, true);
  },
});

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || ''));

const canSendMail = () => Boolean(
  nodemailer &&
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const createMailTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const mailBrand = {
  appName: process.env.MAIL_APP_NAME || 'SLPA Inventory Management System',
  companyName: process.env.MAIL_COMPANY_NAME || 'Sri Lanka Ports Authority',
  supportEmail: process.env.MAIL_SUPPORT_EMAIL || process.env.SMTP_USER,
  signInUrl: process.env.APP_SIGN_IN_URL || 'http://localhost:5173',
};

const renderCompanyEmail = ({ title, previewText, greeting, body, action, footerNote }) => {
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(previewText);
  const safeGreeting = escapeHtml(greeting);
  const safeCompany = escapeHtml(mailBrand.companyName);
  const safeApp = escapeHtml(mailBrand.appName);
  const safeSupportEmail = escapeHtml(mailBrand.supportEmail);
  const safeFooterNote = escapeHtml(footerNote || 'This is an automated message. Please do not share account credentials or security codes with anyone.');

  const bodyHtml = body.map((paragraph) => `<p>${paragraph}</p>`).join('');
  const actionHtml = action ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td style="border-radius: 6px; background: #e31e24;">
          <a href="${escapeHtml(action.href)}" style="display: inline-block; padding: 13px 22px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
            ${escapeHtml(action.label)}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f6fa; font-family: Arial, Helvetica, sans-serif; color:#102033;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fa; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #dce4ee; border-radius:10px; overflow:hidden;">
            <tr>
              <td style="background:#08243d; padding:26px 32px; color:#ffffff;">
                <div style="font-size:12px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#8bd3ff;">${safeCompany}</div>
                <div style="margin-top:8px; font-size:22px; font-weight:800; line-height:1.25;">${safeApp}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px;">
                <h1 style="margin:0 0 18px; color:#102033; font-size:24px; line-height:1.25;">${safeTitle}</h1>
                <p style="margin:0 0 16px; font-size:16px; line-height:1.65;">${safeGreeting}</p>
                <div style="font-size:15px; line-height:1.7; color:#334155;">${bodyHtml}</div>
                ${actionHtml}
                <p style="margin:24px 0 0; font-size:13px; line-height:1.6; color:#64748b;">Need help? Contact ${safeSupportEmail}.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 32px; color:#64748b; font-size:12px; line-height:1.6;">
                ${safeFooterNote}<br>
                &copy; 2026 ${safeCompany}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const sendAccountEmail = async ({ to, fullName, username, password }) => {
  if (!to || !canSendMail()) return false;

  const transporter = createMailTransporter();
  const html = renderCompanyEmail({
    title: 'Your account has been created',
    previewText: `Your ${mailBrand.appName} account is ready.`,
    greeting: `Hello ${fullName},`,
    body: [
      `An administrator has created your ${escapeHtml(mailBrand.appName)} account.`,
      `Username: <strong>${escapeHtml(username)}</strong><br>Temporary password: <strong>${escapeHtml(password)}</strong>`,
      'Please sign in and change your password after your first login. Keep these credentials private.',
    ],
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `${mailBrand.companyName}: Your inventory portal account is ready`,
    text: [
      `Hello ${fullName},`,
      '',
      `An administrator has created your ${mailBrand.appName} account.`,
      '',
      `Username: ${username}`,
      `Temporary password: ${password}`,
      '',
      'Please change your password after your first login and keep these credentials private.',
    ].join('\n'),
    html,
  });

  return true;
};

const sendPasswordOtpEmail = async ({ to, fullName, otp }) => {
  if (!to || !canSendMail()) return false;

  const transporter = createMailTransporter();
  const html = renderCompanyEmail({
    title: 'Password change verification code',
    previewText: 'Use this code to verify your password change request.',
    greeting: `Hello ${fullName},`,
    body: [
      `Use the verification code below to continue changing your ${escapeHtml(mailBrand.appName)} password.`,
      `<span style="display:inline-block; margin:8px 0 4px; padding:14px 18px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; color:#08243d; font-size:28px; font-weight:800; letter-spacing:6px;">${escapeHtml(otp)}</span>`,
      'This code expires in 10 minutes. If you did not request this change, contact your administrator immediately.',
    ],
    footerNote: 'For your security, never forward this verification code or share it with anyone.',
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `${mailBrand.companyName}: Password change verification code`,
    text: [
      `Hello ${fullName},`,
      '',
      `Use this verification code to change your ${mailBrand.appName} password.`,
      '',
      `Verification code: ${otp}`,
      '',
      'This code expires in 10 minutes. If you did not request this change, contact your administrator immediately.',
    ].join('\n'),
    html,
  });

  return true;
};

db.query("ALTER TABLE users ADD COLUMN uEmail VARCHAR(255) NULL AFTER contactNo", (err) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.error('Unable to ensure users.uEmail column:', err.message || err);
  }
});



// TEST API
app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});


// REGISTER API
app.post("/register", (req, res) => {
  res.status(403).json({
    success: false,
    message: "Public registration is disabled. Ask an administrator to create the account."
  });
});


// LOGIN API
const loginAttempts = new Map();
const loginRateLimit = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 15 * 60 * 1000;
  }
  record.count += 1;
  loginAttempts.set(key, record);
  if (record.count > 10) {
    return res.status(429).json({ success: false, message: "Too many login attempts. Try again later." });
  }
  next();
};

app.post("/login", loginRateLimit, (req, res) => {

  const { uUsername, uPassword } = req.body;

  const sql = `
    SELECT uId, uUsername, uFullName, uPassword, NULL AS uEmail, roleId
    FROM users
    WHERE uUsername = ? AND flag = 1 AND uStatus = 'Active'
    LIMIT 1
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

    if (!user.uPassword || !String(user.uPassword).startsWith('$2')) {
      console.error(`Invalid password hash for user ${user.uUsername}`);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    let match = false;
    try {
      match = await bcrypt.compare(
        uPassword,
        user.uPassword
      );
    } catch (error) {
      console.error(`Password check failed for user ${user.uUsername}:`, error.message || error);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    if (match) {
      loginAttempts.delete(req.ip);

      const token = jwt.sign(
        { id: user.uId, username: user.uUsername, roleId: user.roleId },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      res.json({
        success: true,
        message: "Login Success",
        token: token,
        user: {
          id: user.uId,
          username: user.uUsername,
          fullName: user.uFullName,
          email: user.uEmail,
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

  const parts = token.split(" ");
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({ success: false, message: "Invalid authorization header" });
  }
  jwt.verify(parts[1], jwtSecret, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Unauthorized!" });
    req.userId = decoded.id;
    req.userRole = decoded.roleId;
    next();
  });
};

// MIDDLEWARE: VERIFY ADMIN OFFICER (roleId = 4)
const verifyAdminOfficer = (req, res, next) => {
  if (Number(req.userRole) !== 4) {
    return res.status(403).json({ success: false, message: "Access denied. Admin Officers only." });
  }
  next();
};

const verifyEditor = (req, res, next) => {
  const allowed = [1, 2, 3, 4]; // All active roles can manage operational data.
  if (!allowed.includes(Number(req.userRole))) {
    return res.status(403).json({ success: false, message: "This account has read-only access." });
  }
  next();
};

const isValidPhone = (value) => !value || /^\d{10}$/.test(String(value));
const isStrongEnoughPassword = (value) => typeof value === 'string' && value.length >= 8;
const passwordChangeOtps = new Map();

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getActiveUserById = async (userId) => {
  const [rows] = await db.promise().execute(
    `SELECT uId, uUsername, uFullName, uPassword, uEmail
     FROM users
     WHERE uId = ? AND flag = 1 AND uStatus = 'Active'
     LIMIT 1`,
    [userId]
  );
  return rows[0];
};

app.post("/api/auth/password-change/request", verifyToken, async (req, res) => {
  try {
    const user = await getActiveUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }
    if (!user.uEmail) {
      return res.status(400).json({ success: false, message: "No email address is saved for this account. Ask an admin to add one." });
    }
    if (!canSendMail()) {
      return res.status(503).json({ success: false, message: "Email service is not configured." });
    }

    const otp = createOtp();
    passwordChangeOtps.set(user.uId, {
      otpHash: await bcrypt.hash(otp, 10),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    await sendPasswordOtpEmail({
      to: user.uEmail,
      fullName: user.uFullName,
      otp,
    });

    res.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) {
    console.error('Password OTP send failed:', error.message || error);
    res.status(500).json({ success: false, message: "Unable to send OTP." });
  }
});

app.post("/api/auth/password-change/confirm", verifyToken, async (req, res) => {
  const otp = String(req.body.otp || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: "Enter the 6-digit OTP." });
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
  }

  const record = passwordChangeOtps.get(req.userId);
  if (!record || record.expiresAt < Date.now()) {
    passwordChangeOtps.delete(req.userId);
    return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
  }
  if (record.attempts >= 5) {
    passwordChangeOtps.delete(req.userId);
    return res.status(429).json({ success: false, message: "Too many OTP attempts. Please request a new one." });
  }

  record.attempts += 1;
  const matches = await bcrypt.compare(otp, record.otpHash);
  if (!matches) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.promise().execute(
      `UPDATE users SET uPassword = ?, updatedDate = NOW() WHERE uId = ?`,
      [hashedPassword, req.userId]
    );
    passwordChangeOtps.delete(req.userId);
    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to change password." });
  }
});

// DASHBOARD STATS API
app.get("/api/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [
      [userRows],
      [inventoryRows],
      [supplierRows],
      [invoiceRows],
      [warrantyCountRows],
      [warrantyRows],
      [categoryRows],
      [recentInventoryRows],
      [recentAdjustmentRows]
    ] = await Promise.all([
      promiseDb.query("SELECT COUNT(*) AS count FROM users WHERE flag=1 AND uStatus='Active'"),
      promiseDb.query(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN UPPER(COALESCE(itemCondition, 'GOOD')) NOT IN ('DAMAGED', 'DISPOSAL') THEN 1 ELSE 0 END) AS good,
          SUM(CASE WHEN UPPER(itemCondition) = 'DAMAGED' THEN 1 ELSE 0 END) AS damaged,
          SUM(CASE WHEN UPPER(itemCondition) = 'DISPOSAL' THEN 1 ELSE 0 END) AS disposal
        FROM inventory_items WHERE flag=1
      `),
      promiseDb.query("SELECT COUNT(*) AS count FROM suppliers WHERE flag=1"),
      promiseDb.query("SELECT COUNT(*) AS count, COALESCE(SUM(totalAmount), 0) AS totalValue FROM invoices WHERE flag=1"),
      promiseDb.query(`
        SELECT COUNT(*) AS count FROM inventory_items
        WHERE flag=1 AND warrantyExpireDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      `),
      promiseDb.query(`
        SELECT i.itemId, i.itemCode, i.serialNumber, i.warrantyExpireDate,
          DATEDIFF(i.warrantyExpireDate, CURDATE()) AS daysRemaining,
          COALESCE(s.subCategoryName, i.itemName, 'Inventory item') AS itemName
        FROM inventory_items i
        LEFT JOIN sub_categories s ON i.subCategoryId=s.subCategoryId
        WHERE i.flag=1
          AND i.warrantyExpireDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY i.warrantyExpireDate ASC
        LIMIT 6
      `),
      promiseDb.query(`
        SELECT COALESCE(m.mainCategoryName, 'Uncategorized') AS categoryName, COUNT(*) AS itemCount
        FROM inventory_items i
        LEFT JOIN main_categories m ON i.mainCategoryId=m.mainCategoryId
        WHERE i.flag=1
        GROUP BY i.mainCategoryId, m.mainCategoryName
        ORDER BY itemCount DESC, categoryName ASC
        LIMIT 6
      `),
      promiseDb.query(`
        SELECT i.itemId, i.itemCode, i.serialNumber, i.itemCondition, i.createdDate,
          COALESCE(s.subCategoryName, i.itemName, 'Inventory item') AS itemName,
          COALESCE(d.description, 'Unassigned') AS divisionName,
          COALESCE(u.uFullName, 'System') AS createdByName
        FROM inventory_items i
        LEFT JOIN sub_categories s ON i.subCategoryId=s.subCategoryId
        LEFT JOIN divisions d ON i.divisionId=d.division_id
        LEFT JOIN users u ON i.createdBy=u.uId
        WHERE i.flag=1
        ORDER BY i.createdDate DESC, i.itemId DESC
        LIMIT 5
      `),
      promiseDb.query(`
        SELECT sa.adjustmentId, UPPER(sa.adjustmentType) AS adjustmentType,
          sa.adjustmentDate, sa.remarks, i.itemCode,
          COALESCE(s.subCategoryName, i.itemName, 'Inventory item') AS itemName,
          COALESCE(u.uFullName, 'System') AS createdByName
        FROM stock_adjustments sa
        LEFT JOIN inventory_items i ON sa.itemId=i.itemId
        LEFT JOIN sub_categories s ON i.subCategoryId=s.subCategoryId
        LEFT JOIN users u ON sa.createdBy=u.uId
        WHERE sa.flag=1
        ORDER BY sa.adjustmentDate DESC, sa.adjustmentId DESC
        LIMIT 5
      `)
    ]);

    const inventory = inventoryRows[0] || {};
    const invoices = invoiceRows[0] || {};

    res.json({
      success: true,
      stats: {
        users: Number(userRows[0]?.count || 0),
        items: Number(inventory.total || 0),
        good: Number(inventory.good || 0),
        damaged: Number(inventory.damaged || 0),
        disposal: Number(inventory.disposal || 0),
        suppliers: Number(supplierRows[0]?.count || 0),
        invoices: Number(invoices.count || 0),
        invoiceValue: Number(invoices.totalValue || 0),
        warrantiesDue: Number(warrantyCountRows[0]?.count || 0)
      },
      warrantyAlerts: warrantyRows,
      categoryDistribution: categoryRows.map(row => ({
        categoryName: row.categoryName,
        itemCount: Number(row.itemCount)
      })),
      recentInventory: recentInventoryRows,
      recentAdjustments: recentAdjustmentRows
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: "Unable to load dashboard data." });
  }
});

// =========================
// USER MANAGEMENT APIs (Admin Only)
// =========================
app.get("/api/users", verifyToken, verifyAdminOfficer, (req, res) => {
  const sql = `
    SELECT u.uId, u.uUsername, u.uFullName, u.uEmpNo, u.uStatus, u.contactNo, u.uEmail,
           u.roleId, r.roleName, u.divisionId, d.description as divisionName,
           u.sectionId, s.sectionname as sectionName, u.registeredDate as createdDate
    FROM users u
    LEFT JOIN user_roles r ON u.roleId = r.roleId
    LEFT JOIN divisions d ON u.divisionId = d.division_id
    LEFT JOIN sections s ON u.sectionId = s.sectionid
    WHERE u.flag = 1
    ORDER BY u.registeredDate DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, users: result });
  });
});

app.post("/api/users", verifyToken, verifyAdminOfficer, async (req, res) => {
  const { uFullName, uPassword, uStatus, uEmpNo, roleId, sectionId, divisionId, contactNo } = req.body;
  const uUsername = String(req.body.uUsername || '').trim();
  const uEmail = String(req.body.uEmail || '').trim();
  if (!uUsername || !uPassword || !uFullName) {
    return res.status(400).json({ success: false, message: "Username, full name and password are required." });
  }
  if (uEmail && !isValidEmail(uEmail)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }
  if (!isStrongEnoughPassword(uPassword)) {
    return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
  }
  if (!isValidPhone(contactNo)) {
    return res.status(400).json({ success: false, message: "Contact number must contain exactly 10 digits." });
  }
  try {
    const [existing] = await db.promise().execute('SELECT uId FROM users WHERE uUsername=? LIMIT 1', [uUsername]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: "Username is already in use." });
    }
    const hashedPassword = await bcrypt.hash(uPassword, 10);
    const sql = `INSERT INTO users (uUsername, uFullName, uPassword, uStatus, uEmpNo, roleId, sectionId, divisionId, contactNo, uEmail)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.promise().execute(sql, [uUsername, uFullName, hashedPassword, uStatus || 'Active', uEmpNo, roleId, sectionId, divisionId, contactNo, uEmail || null]);

    let emailSent = false;
    let emailError = null;
    if (uEmail) {
      try {
        if (!nodemailer) {
          throw new Error("Email package is not installed. Run npm install to install nodemailer.");
        }
        if (!canSendMail()) {
          throw new Error("Email service is not configured.");
        }
        emailSent = await sendAccountEmail({
          to: uEmail,
          fullName: uFullName,
          username: uUsername,
          password: uPassword,
        });
      } catch (mailError) {
        emailError = mailError.message || "Unable to send account email.";
        console.error('Unable to send account email:', mailError.message || mailError);
      }
    }

    res.json({
      success: true,
      message: emailSent ? "User created and credentials emailed!" : "User created successfully!",
      emailSent,
      emailError,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.put("/api/users/:id", verifyToken, verifyAdminOfficer, async (req, res) => {
  const { id } = req.params;
  const { uFullName, uPassword, uStatus, uEmpNo, roleId, sectionId, divisionId, contactNo } = req.body;
  const uUsername = String(req.body.uUsername || '').trim();
  const uEmail = String(req.body.uEmail || '').trim();
  if (!uUsername || !uFullName || !isValidPhone(contactNo)) {
    return res.status(400).json({ success: false, message: "Valid username, full name, and contact number are required." });
  }
  if (uEmail && !isValidEmail(uEmail)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }
  if (uPassword && !isStrongEnoughPassword(uPassword)) {
    return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
  }
  try {
    const [existing] = await db.promise().execute('SELECT uId FROM users WHERE uUsername=? AND uId<>? LIMIT 1', [uUsername, id]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: "Username is already in use." });
    }
    if (uPassword && uPassword.trim() !== "") {
      const hashedPassword = await bcrypt.hash(uPassword, 10);
      const sql = `UPDATE users SET uUsername=?, uFullName=?, uPassword=?, uStatus=?, uEmpNo=?, roleId=?, sectionId=?, divisionId=?, contactNo=?, uEmail=?, updatedDate=NOW() WHERE uId=?`;
      db.query(sql, [uUsername, uFullName, hashedPassword, uStatus, uEmpNo, roleId, sectionId, divisionId, contactNo, uEmail || null, id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "User updated successfully!" });
      });
    } else {
      const sql = `UPDATE users SET uUsername=?, uFullName=?, uStatus=?, uEmpNo=?, roleId=?, sectionId=?, divisionId=?, contactNo=?, uEmail=?, updatedDate=NOW() WHERE uId=?`;
      db.query(sql, [uUsername, uFullName, uStatus, uEmpNo, roleId, sectionId, divisionId, contactNo, uEmail || null, id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "User updated successfully!" });
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.delete("/api/users/:id", verifyToken, verifyAdminOfficer, (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.userId) {
    return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
  }
  const sql = `UPDATE users SET flag=0, deletedDate=NOW() WHERE uId=?`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "User deactivated successfully!" });
  });
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

app.post("/api/categories/item-types", verifyToken, verifyEditor, (req, res) => {
  const { name, remarks } = req.body;
  if (!String(name || '').trim()) return res.status(400).json({ success: false, message: "Item type name is required." });
  const sql = `INSERT INTO item_types (itemTypeName, remarks, createdBy) VALUES (?, ?, ?)`;
  db.query(sql, [name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item type added!" });
  });
});

app.put("/api/categories/item-types/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const { name, remarks } = req.body;
  if (!String(name || '').trim()) return res.status(400).json({ success: false, message: "Item type name is required." });
  const sql = `UPDATE item_types SET itemTypeName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE itemTypeId=?`;
  db.query(sql, [name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Item type updated!" });
  });
});

app.delete("/api/categories/item-types/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ success: false, error: connErr });
    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return res.status(500).json({ success: false, error: txErr });
      }

      const queries = [
        ['UPDATE sub_categories s JOIN main_categories m ON s.mainCategoryId = m.mainCategoryId SET s.flag=0, s.deletedBy=?, s.deletedDate=NOW() WHERE m.itemTypeId=?', [req.userId, id]],
        ['UPDATE main_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE itemTypeId=?', [req.userId, id]],
        ['UPDATE item_types SET flag=0, deletedBy=?, deletedDate=NOW() WHERE itemTypeId=?', [req.userId, id]],
      ];

      const runNext = (index = 0) => {
        if (index >= queries.length) {
          return connection.commit((commitErr) => {
            connection.release();
            if (commitErr) return res.status(500).json({ success: false, error: commitErr });
            res.json({ success: true, message: "Item type deleted!" });
          });
        }

        connection.query(queries[index][0], queries[index][1], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, error: err });
            });
          }
          runNext(index + 1);
        });
      };

      runNext();
    });
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

app.post("/api/categories/main-categories", verifyToken, verifyEditor, (req, res) => {
  const { itemTypeId, name, remarks } = req.body;
  if (!itemTypeId || !String(name || '').trim()) return res.status(400).json({ success: false, message: "Item type and category name are required." });
  const sql = `INSERT INTO main_categories (itemTypeId, mainCategoryName, remarks, createdBy) VALUES (?, ?, ?, ?)`;
  db.query(sql, [itemTypeId, name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Main category added!" });
  });
});

app.put("/api/categories/main-categories/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const { itemTypeId, name, remarks } = req.body;
  if (!itemTypeId || !String(name || '').trim()) return res.status(400).json({ success: false, message: "Item type and category name are required." });
  const sql = `UPDATE main_categories SET itemTypeId=?, mainCategoryName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE mainCategoryId=?`;
  db.query(sql, [itemTypeId, name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Main category updated!" });
  });
});

app.delete("/api/categories/main-categories/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ success: false, error: connErr });
    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return res.status(500).json({ success: false, error: txErr });
      }

      connection.query('UPDATE sub_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE mainCategoryId=?', [req.userId, id], (subErr) => {
        if (subErr) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, error: subErr });
          });
        }

        connection.query('UPDATE main_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE mainCategoryId=?', [req.userId, id], (mainErr) => {
          if (mainErr) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, error: mainErr });
            });
          }

          connection.commit((commitErr) => {
            connection.release();
            if (commitErr) return res.status(500).json({ success: false, error: commitErr });
            res.json({ success: true, message: "Main category deleted!" });
          });
        });
      });
    });
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

app.post("/api/categories/sub-categories", verifyToken, verifyEditor, (req, res) => {
  const { mainCategoryId, name, remarks } = req.body;
  if (!mainCategoryId || !String(name || '').trim()) return res.status(400).json({ success: false, message: "Main category and subcategory name are required." });
  const sql = `INSERT INTO sub_categories (mainCategoryId, subCategoryName, remarks, createdBy) VALUES (?, ?, ?, ?)`;
  db.query(sql, [mainCategoryId, name, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Sub category added!" });
  });
});

app.put("/api/categories/sub-categories/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const { mainCategoryId, name, remarks } = req.body;
  if (!mainCategoryId || !String(name || '').trim()) return res.status(400).json({ success: false, message: "Main category and subcategory name are required." });
  const sql = `UPDATE sub_categories SET mainCategoryId=?, subCategoryName=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE subCategoryId=?`;
  db.query(sql, [mainCategoryId, name, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Sub category updated!" });
  });
});

app.delete("/api/categories/sub-categories/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE sub_categories SET flag=0, deletedBy=?, deletedDate=NOW() WHERE subCategoryId=?`;
  db.query(sql, [req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Subcategory not found." });
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

app.post("/api/suppliers", verifyToken, verifyEditor, (req, res) => {
  const { name, contactPerson, contactNo, email, address, remarks } = req.body;
  if (!String(name || '').trim() || !String(contactPerson || '').trim() || !contactNo || !isValidPhone(contactNo) || !/^\S+@\S+\.\S+$/.test(String(email || ''))) {
    return res.status(400).json({ success: false, message: "Valid supplier, contact person, 10-digit phone, and email are required." });
  }
  const sql = `INSERT INTO suppliers (supplierName, contactPerson, contactNo, email, address, remarks, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, contactPerson, contactNo, email, address, remarks, req.userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Supplier added successfully!" });
  });
});

app.put("/api/suppliers/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, contactNo, email, address, remarks } = req.body;
  if (!String(name || '').trim() || !String(contactPerson || '').trim() || !contactNo || !isValidPhone(contactNo) || !/^\S+@\S+\.\S+$/.test(String(email || ''))) {
    return res.status(400).json({ success: false, message: "Valid supplier, contact person, 10-digit phone, and email are required." });
  }
  const sql = `UPDATE suppliers SET supplierName=?, contactPerson=?, contactNo=?, email=?, address=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE supplierId=?`;
  db.query(sql, [name, contactPerson, contactNo, email, address, remarks, req.userId, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: "Supplier updated successfully!" });
  });
});

app.delete("/api/suppliers/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE suppliers SET flag=0, deletedBy=?, deletedDate=NOW()
               WHERE supplierId=? AND NOT EXISTS (SELECT 1 FROM invoices WHERE supplierId=? AND flag=1)`;
  db.query(sql, [req.userId, id, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (!result.affectedRows) return res.status(409).json({ success: false, message: "Supplier has active invoices and cannot be deleted." });
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

app.post("/api/inventory", verifyToken, verifyEditor, async (req, res) => {
  const {
    itemTypeId, mainCategoryId,
    subCategoryId, divisionId, sectionId, quantity, itemCondition,
    purchaseDate, warrantyExpireDate, remarks, serialNumber, invoiceId
  } = req.body;

  const qtyNum = Number.parseInt(quantity, 10);
  if (![itemTypeId, mainCategoryId, subCategoryId, divisionId, sectionId, invoiceId].every(Boolean) ||
      !Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 500 || !purchaseDate || !warrantyExpireDate) {
    return res.status(400).json({ success: false, message: "Valid categories, location, invoice, dates, and quantity (1-500) are required." });
  }
  const serialValue = String(serialNumber || '').trim();
  if (!serialValue) {
    return res.status(400).json({ success: false, message: "A serial number is required." });
  }

  const connection = await db.promise().getConnection();
  const year = new Date().getFullYear();
  const codeLockName = `inventory-code-${subCategoryId}-${year}`;
  let codeLockHeld = false;
  try {
    await connection.beginTransaction();
    const [[lockResult]] = await connection.execute('SELECT GET_LOCK(?, 5) AS acquired', [codeLockName]);
    if (lockResult.acquired !== 1) throw new Error('Unable to reserve an inventory code sequence.');
    codeLockHeld = true;
    const [[itemType]] = await connection.execute("SELECT itemTypeName FROM item_types WHERE itemTypeId=? AND flag=1", [itemTypeId]);
    const [[mainCategory]] = await connection.execute("SELECT mainCategoryName FROM main_categories WHERE mainCategoryId=? AND itemTypeId=? AND flag=1", [mainCategoryId, itemTypeId]);
    const [[subCategory]] = await connection.execute("SELECT subCategoryName FROM sub_categories WHERE subCategoryId=? AND mainCategoryId=? AND flag=1", [subCategoryId, mainCategoryId]);
    const [[division]] = await connection.execute("SELECT description FROM divisions WHERE division_id=?", [divisionId]);
    const [[section]] = await connection.execute("SELECT sectionid FROM sections WHERE sectionid=? AND division_id=?", [sectionId, divisionId]);
    const [[invoice]] = await connection.execute("SELECT invoiceId FROM invoices WHERE invoiceId=? AND flag=1", [invoiceId]);
    if (!itemType || !mainCategory || !subCategory || !division || !section || !invoice) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "One or more selected references are invalid or inactive." });
    }

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

    const divName = division.description || '';
    const divCode = getDivShortForm(divName, 'DIV');
    const itemTypeCode = getShortForm(itemType.itemTypeName || '', 'GEN');
    const mainCatCode = getShortForm(mainCategory.mainCategoryName || '', 'GEN');
    const subCategoryName = subCategory.subCategoryName || 'Unknown';
    const subCatCode = getShortForm(subCategoryName, 'GEN');
    const itemName = subCategoryName;
    const [sequenceRows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM inventory_items WHERE subCategoryId=? AND YEAR(createdDate)=? FOR UPDATE",
      [subCategoryId, year]
    );
    const sequenceStart = Number(sequenceRows[0].count);
    const itemCodePrefix = `${divCode}/${itemTypeCode}/${mainCatCode}/${subCatCode}/${year}`;
    const serialCode = serialValue.toUpperCase().replace(/[^A-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'SN';

    for (let i = 1; i <= qtyNum; i++) {
        const sequenceNumber = sequenceStart + i;
        const generatedItemCode = `${itemCodePrefix}/${sequenceNumber}/${serialCode}`;

        const sql = `
          INSERT INTO inventory_items (
            itemCode, itemName, serialNumber, itemTypeId, mainCategoryId, 
            subCategoryId, divisionId, sectionId, quantity, itemCondition, 
            purchaseDate, warrantyExpireDate, remarks, invoiceId, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          generatedItemCode, itemName, serialValue, itemTypeId, mainCategoryId,
          subCategoryId, divisionId, sectionId, 1, 'Good',
          purchaseDate || null, warrantyExpireDate || null, remarks || null, invoiceId || null, req.userId
        ];
        
        await connection.execute(sql, values);
    }

    await connection.commit();
    res.json({ success: true, message: "Item(s) added successfully!" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to create inventory items." });
  } finally {
    if (codeLockHeld) {
      try { await connection.execute('SELECT RELEASE_LOCK(?)', [codeLockName]); } catch (releaseError) { console.error(releaseError.message); }
    }
    connection.release();
  }
});

app.put("/api/inventory/:id", verifyToken, verifyEditor, async (req, res) => {
  const { id } = req.params;
  const {
    itemTypeId, mainCategoryId,
    subCategoryId, divisionId, sectionId,
    purchaseDate, warrantyExpireDate, remarks, serialNumber, invoiceId
  } = req.body;

  if (![itemTypeId, mainCategoryId, subCategoryId, divisionId, sectionId, invoiceId].every(Boolean) ||
      !String(serialNumber || '').trim() || !purchaseDate || !warrantyExpireDate) {
    return res.status(400).json({ success: false, message: "Categories, location, serial number, invoice, and dates are required." });
  }
  try {
    const subCatRes = await new Promise((resolve, reject) => {
      db.query("SELECT subCategoryName FROM sub_categories WHERE subCategoryId=?", [subCategoryId || 0], (err, r) => err ? reject(err) : resolve(r));
    });
    const itemName = subCatRes[0]?.subCategoryName || 'Unknown';

    const sql = `
      UPDATE inventory_items SET 
        itemName=?, serialNumber=?, itemTypeId=?, mainCategoryId=?, 
        subCategoryId=?, divisionId=?, sectionId=?,
        purchaseDate=?, warrantyExpireDate=?, remarks=?, invoiceId=?, updatedBy=?, updatedDate=NOW()
      WHERE itemId=?
    `;
    const values = [
      itemName, serialNumber || null, itemTypeId, mainCategoryId,
      subCategoryId, divisionId, sectionId,
      purchaseDate || null, warrantyExpireDate || null, remarks || null, invoiceId || null, req.userId, id
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, message: "Item updated successfully!" });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

app.delete("/api/inventory/:id", verifyToken, verifyEditor, (req, res) => {
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

app.get("/api/invoices/:id/attachment", verifyToken, (req, res) => {
  db.query('SELECT invoiceImage FROM invoices WHERE invoiceId=? AND flag=1', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Unable to load attachment." });
    if (!rows.length || !rows[0].invoiceImage) return res.status(404).json({ success: false, message: "Attachment not found." });
    const filename = path.basename(rows[0].invoiceImage);
    res.sendFile(path.join(__dirname, 'uploads', filename));
  });
});

const removeUpload = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(__dirname, 'uploads', path.basename(filename)), () => {});
};

const validateInvoice = ({ invoiceNumber, supplierId, invoiceDate, totalAmount }) => {
  if (!String(invoiceNumber || '').trim() || !supplierId || !invoiceDate) return 'Invoice number, supplier, and invoice date are required.';
  if (!Number.isFinite(Number(totalAmount)) || Number(totalAmount) < 0) return 'Total amount must be a non-negative number.';
  return null;
};

app.post("/api/invoices", verifyToken, verifyEditor, upload.single('invoiceImage'), (req, res) => {
  const { invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks } = req.body;
  const invoiceImage = req.file ? req.file.filename : null;
  const cleanPoDate = poDate && poDate.trim() !== "" ? poDate : null;
  const cleanInvoiceDate = invoiceDate && invoiceDate.trim() !== "" ? invoiceDate : null;
  const cleanPoNo = poNo && poNo.trim() !== "" ? poNo : null;
  const cleanRemarks = remarks && remarks.trim() !== "" ? remarks : null;
  const validationError = validateInvoice(req.body);
  if (validationError) {
    removeUpload(invoiceImage);
    return res.status(400).json({ success: false, message: validationError });
  }

  const sql = `INSERT INTO invoices (invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks, invoiceImage, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [invoiceNumber, supplierId, cleanPoNo, cleanPoDate, cleanInvoiceDate, totalAmount, cleanRemarks, invoiceImage, req.userId], (err, result) => {
    if (err) {
      removeUpload(invoiceImage);
      console.error("Invoice Add Error:", err);
      return res.status(500).json({ success: false, message: "Unable to add invoice." });
    }
    res.json({ success: true, message: "Invoice added successfully!" });
  });
});

app.put("/api/invoices/:id", verifyToken, verifyEditor, upload.single('invoiceImage'), (req, res) => {
  const { id } = req.params;
  const { invoiceNumber, supplierId, poNo, poDate, invoiceDate, totalAmount, remarks } = req.body;
  const invoiceImage = req.file ? req.file.filename : null;
  const cleanPoDate = poDate && poDate.trim() !== "" ? poDate : null;
  const cleanInvoiceDate = invoiceDate && invoiceDate.trim() !== "" ? invoiceDate : null;
  const cleanPoNo = poNo && poNo.trim() !== "" ? poNo : null;
  const cleanRemarks = remarks && remarks.trim() !== "" ? remarks : null;
  const validationError = validateInvoice(req.body);
  if (validationError) {
    removeUpload(invoiceImage);
    return res.status(400).json({ success: false, message: validationError });
  }
  
  let sql = `UPDATE invoices SET invoiceNumber=?, supplierId=?, poNo=?, poDate=?, invoiceDate=?, totalAmount=?, remarks=?, updatedBy=?, updatedDate=NOW() WHERE invoiceId=?`;
  let params = [invoiceNumber, supplierId, cleanPoNo, cleanPoDate, cleanInvoiceDate, totalAmount, cleanRemarks, req.userId, id];

  if (invoiceImage) {
    sql = `UPDATE invoices SET invoiceNumber=?, supplierId=?, poNo=?, poDate=?, invoiceDate=?, totalAmount=?, remarks=?, invoiceImage=?, updatedBy=?, updatedDate=NOW() WHERE invoiceId=?`;
    params = [invoiceNumber, supplierId, cleanPoNo, cleanPoDate, cleanInvoiceDate, totalAmount, cleanRemarks, invoiceImage, req.userId, id];
  }

  db.query('SELECT invoiceImage FROM invoices WHERE invoiceId=? AND flag=1', [id], (lookupErr, rows) => {
    if (lookupErr) {
      removeUpload(invoiceImage);
      return res.status(500).json({ success: false, message: "Unable to load invoice." });
    }
    if (!rows.length) {
      removeUpload(invoiceImage);
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }
    db.query(sql, params, (err) => {
      if (err) {
        removeUpload(invoiceImage);
        console.error("Invoice Update Error:", err.message);
        return res.status(500).json({ success: false, message: "Unable to update invoice." });
      }
      if (invoiceImage && rows[0].invoiceImage !== invoiceImage) removeUpload(rows[0].invoiceImage);
      res.json({ success: true, message: "Invoice updated successfully!" });
    });
  });
});

app.delete("/api/invoices/:id", verifyToken, verifyEditor, (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE invoices SET flag=0, deletedBy=?, deletedDate=NOW()
               WHERE invoiceId=? AND NOT EXISTS (SELECT 1 FROM inventory_items WHERE invoiceId=? AND flag=1)`;
  db.query(sql, [req.userId, id, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (!result.affectedRows) return res.status(409).json({ success: false, message: "Invoice is linked to active inventory and cannot be deleted." });
    res.json({ success: true, message: "Invoice deleted successfully!" });
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

app.use((err, req, res, next) => {
  if (req.file?.filename) removeUpload(req.file.filename);
  console.error(err.message);
  const status = err instanceof multer.MulterError || err.message?.includes('allowed') ? 400 : 500;
  res.status(status).json({ success: false, message: status === 400 ? err.message : 'Internal server error.' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Server Running On Port ${port}`));
}

module.exports = app;
