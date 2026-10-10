const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://acharyapratistha006_db_user:sana%402006%23@cluster0.sxia2bd.mongodb.net/contact_mark?appName=Cluster0"
    );
    console.log("Connection to database established...");
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;