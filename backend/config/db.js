const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function connectDB() {
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
  });
  logger.info(`[db] MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = connectDB;
