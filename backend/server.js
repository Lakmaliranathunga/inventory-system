 const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();

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

        if(err){

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

  } catch(error) {

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

    if(err){

      return res.status(500).json({
        success: false,
        message: "Database Error"
      });

    }

    if(result.length === 0){

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

    if(match){

      res.json({
        success: true,
        message: "Login Success"
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

  const sql = "SELECT * FROM divisions";

  db.query(sql, (err, result) => {

    if(err){

      res.status(500).send(err);

    } else {

      res.json(result);

    }

  });

});


// GET SECTIONS
app.get("/sections", (req, res) => {

  const sql = "SELECT * FROM sections";

  db.query(sql, (err, result) => {

    if(err){

      res.status(500).send(err);

    } else {

      res.json(result);

    }

  });

});


// SERVER
app.listen(5000, () => {
  console.log("Server Running On Port 5000");
});