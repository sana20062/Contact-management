
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const auth = require("../middlewares/auth");

// Email validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// REGISTER ROUTE: POST /api/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please enter all the required fields",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (name.trim().length === 0 || name.length > 25) {
      return res.status(400).json({
        error: "Name must be between 1 and 25 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        error: "A user with that email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    const userDoc = savedUser.toObject();
    delete userDoc.password;

    return res.status(201).json({
      message: "User registered successfully",
      user: userDoc,
    });
  } catch (err) {
    console.error("Registration error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        error: "A user with that email already exists",
      });
    }

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

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (!existingUser) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing from config/config.env");

      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { id: existingUser._id },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const userDoc = existingUser.toObject();
    delete userDoc.password;

    return res.status(200).json({
      token,
      user: userDoc,
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// CURRENT USER ROUTE: GET /api/me
router.get("/me", auth, async (req, res) => {
  try {
    // The auth middleware should attach the user to req.user.
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const userDoc =
      typeof user.toObject === "function" ? user.toObject() : { ...user };

    delete userDoc.password;

    return res.status(200).json({
      user: userDoc,
    });
  } catch (err) {
    console.error("Get current user error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
