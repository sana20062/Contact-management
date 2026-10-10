
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Ensure this matches your actual model filename
const User = require("../models/user");

// REGISTER ROUTE: POST /api/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please enter all the required fields",
      });
    }

    // Email validation
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailReg.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (name.length > 25) {
      return res.status(400).json({
        error: "Name can only be 25 characters or fewer",
      });
    }

    // Check if user already exists
    const doesUserExist = await User.findOne({ email });

    if (doesUserExist) {
      return res.status(400).json({
        error: "A user with that email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    const result = await newUser.save();

    // Exclude password from response
    const userDoc = result.toObject();
    delete userDoc.password;

    return res.status(201).json(userDoc);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// LOGIN ROUTE: POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        error: "Please enter all the required fields",
      });
    }

    // Email validation
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailReg.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address",
      });
    }

    // Check if user exists
    const doesUserExist = await User.findOne({ email });

    if (!doesUserExist) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    // Compare passwords
    const doesPasswordMatch = await bcrypt.compare(
      password,
      doesUserExist.password
    );

    if (!doesPasswordMatch) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const payload = {
      id: doesUserExist._id,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secretKey12345",
      { expiresIn: "1h" }
    );

    // Exclude password from response
    const userDoc = doesUserExist.toObject();
    delete userDoc.password;

    return res.status(200).json({
      token,
      user: userDoc,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
