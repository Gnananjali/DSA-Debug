/**
 * Socket.IO lives in the API process, backed by a Redis adapter so it can
 * receive cross-process broadcasts. The execution worker runs in its own
 * process/dyno and never holds a real `io` instance — it uses a Redis
 * "Emitter" (see queue/executionWorker.js) that speaks the same protocol
 * as the adapter below, so `emitter.to(room).emit(...)` reaches whichever
 * API instance actually holds that user's socket connection.
 */
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const createRedisConnection = require("../config/redis");

let io = null;

function initSockets(httpServer, clientOrigins) {
  io = new Server(httpServer, {
    cors: { origin: clientOrigins, credentials: true },
  });

  const pubClient = createRedisConnection();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
  console.log(`[socket] connected user=${socket.userId}, socket=${socket.id}`);

  const room = `user:${socket.userId}`;
  socket.join(room);

  console.log(`[socket] joined room=${room}`);

  socket.onAny((event, ...args) => {
    console.log(`[socket] received event=${event}`, args);
  });
});

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSockets, getIO };
