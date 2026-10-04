/**
 * Socket.IO lives in the API process, backed by a Redis adapter so it can
 * receive cross-process broadcasts. The execution worker never holds a real
 * `io` instance: it uses a Redis Emitter (see queue/executionWorker.js) that
 * speaks the same protocol, so `emitter.to(room).emit(...)` reaches whichever
 * API instance holds that user's socket connection.
 */
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const createRedisConnection = require("../config/redis");
const logger = require("../utils/logger");

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
      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    // Each user only ever joins their own private room.
    socket.join(`user:${socket.userId}`);
    logger.debug(`[socket] connected user=${socket.userId}`);
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSockets, getIO };
