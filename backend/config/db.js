const mongoose = require("mongoose");

async function connectDB() {
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
  });
  console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = connectDB;
