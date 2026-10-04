/**
 * Promote an existing user to admin:
 *   npm run make-admin -- someone@example.com
 */
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  console.log(`${user.username} (${user.email}) is now an admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
