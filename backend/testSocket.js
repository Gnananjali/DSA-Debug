import { io } from "socket.io-client";

console.log("Starting socket client...");

const socket = io("https://dsa-debug.onrender.com", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection Error:", err.message);
});

socket.on("job-update", (data) => {
  console.log("🚀 JOB UPDATE:", data);
});
