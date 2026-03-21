import Redis from "ioredis";

import { env } from "./env";

const redis = new Redis({
  host: env.redisHost,
  port: env.redisPort,
  username: env.redisUsername || undefined,
  password: env.redisPassword || undefined,
  db: env.redisDb,
});


export const connectRedis = async () => {
  try {
    await redis.ping();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Redis connection failed", error);
    process.exit(1);
  }
};

export default redis;
