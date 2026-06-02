import Redis, { type RedisOptions } from "ioredis";

import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

const buildRedisOptions = (): RedisOptions => {
  if (isProduction) {
    if (!env.upstashRedisHost || !env.upstashRedisPassword) {
      throw new Error(
        "Upstash Redis credentials missing. Set UPSTASH_REDIS_HOST and UPSTASH_REDIS_PASSWORD."
      );
    }
    return {
      host: env.upstashRedisHost,
      port: env.upstashRedisPort,
      password: env.upstashRedisPassword,
      tls: {},
      maxRetriesPerRequest: 3,
      connectTimeout: 10_000,
      commandTimeout: 8_000,
    };
  }

  return {
    host: env.redisHost,
    port: env.redisPort,
    username: env.redisUsername || undefined,
    password: env.redisPassword || undefined,
    db: env.redisDb,
    connectTimeout: 10_000,
    commandTimeout: 8_000,
  };
};

const redis = new Redis(buildRedisOptions());

export const connectRedis = async () => {
  try {
    await redis.ping();
    console.log(
      `Redis connected successfully (${isProduction ? "Upstash" : "local"})`
    );
  } catch (error) {
    console.error("Redis connection failed", error);
    process.exit(1);
  }
};

export default redis;
