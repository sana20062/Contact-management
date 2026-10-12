require("dotenv").config({ path: "./config/config.env" });
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const auth = require("./middlewares/auth");

const app = express();
const cors = require("cors"); app.use(cors());

// Middlewares
app.use(express.json());
app.use(morgan("tiny"));

// Routes
app.use("/api", require("./routes/auth"));

app.get("/protected", auth, (req, res) => { 
  return res.status(200).json({ ...req.user._doc });
 });

// Server Configuration
const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`server listening on port: ${PORT}`);
  } catch (err) {
    console.log(err);
  }
});