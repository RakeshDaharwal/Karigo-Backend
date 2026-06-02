import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectDB } from "./config/db.conn";
import { connectRedis } from "./config/redis.conn";
import { env } from "./config/env";
import http from "http";
import { Server } from "socket.io";
import { handleSocketConnection } from "./app/socket/chat.socket";
import { startLogsCleanupCron } from "./utils/logsCleanup.cron";

const PORT = env.port || 5004;


const startServer = async () => {
  await connectDB();
  await connectRedis();

  startLogsCleanupCron();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => handleSocketConnection(socket, io));

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
