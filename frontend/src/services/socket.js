import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    auth: { token },
  });

  if (import.meta.env.DEV) {
    socket.on("connect_error", (error) => console.warn("[socket] connect error:", error.message));
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
