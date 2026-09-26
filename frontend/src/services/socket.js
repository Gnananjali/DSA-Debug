import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("[socket] CONNECTED:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("[socket] CONNECT ERROR:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] DISCONNECTED:", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
