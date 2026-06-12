import { type ConnectionOptions } from "bullmq";

import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

export const bullConnection: ConnectionOptions = isProduction
  ? {
      host: env.upstashRedisHost,
      port: env.upstashRedisPort,
      password: env.upstashRedisPassword,
      tls: {},
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }
  : {
      host: env.redisHost,
      port: env.redisPort,
      username: env.redisUsername || undefined,
      password: env.redisPassword || undefined,
      db: env.redisDb,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

export const QUEUE_NAMES = {
  messageSave: "message-save",
  messageStatusUpdate: "message-status-update",
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 1000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 24 * 3600 },
};
