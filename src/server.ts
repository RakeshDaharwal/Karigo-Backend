import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectDB } from "./config/db.conn";
import { connectRedis } from "./config/redis.conn";
import { env } from "./config/env";
import http from "http";
import { Server } from "socket.io";
import { initChatSocket } from "./app/socket";
import { startWorkers } from "./queues/startWorkers";
import { closeQueues } from "./queues";
import { startLogsCleanupCron } from "./utils/logsCleanup.cron";

const PORT = env.port || 5004;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  startLogsCleanupCron();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  initChatSocket(io);
  const workers = startWorkers();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    io.close();
    await workers.shutdown();
    await closeQueues();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
};

startServer();
