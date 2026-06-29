const express = require("express");
const router = express.Router();

const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Admin
router.post("/register", async (req, res) => {
  try {

    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = new Admin({
      email,
      password: hashedPassword
    });

    await admin.save();

    res.status(201).json({
      message: "Admin Registered Successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});


// Login Admin
router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        message: "Admin Not Found"
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password"
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});


// Get All Admins (Optional)
router.get("/", async (req, res) => {
  try {

    const admins = await Admin.find().select("-password");

    res.json(admins);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;