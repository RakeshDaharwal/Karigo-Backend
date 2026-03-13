import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectDB } from "./config/db.conn";
import { connectRedis } from "./config/redis.conn";
import { env } from "./config/env";
const PORT = env.port || 5004;


const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
