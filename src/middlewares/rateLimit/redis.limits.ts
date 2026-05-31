import { Request, Response, NextFunction } from "express";
import redis from "../../config/redis.conn";
import { env } from "../../config/env";

const clientKey = (req: Request) => {
  const xf = req.headers["x-forwarded-for"];
  const forwarded =
    typeof xf === "string" ? xf.split(",")[0]?.trim() || "" : "";
  return forwarded || req.ip || req.socket.remoteAddress || "unknown";
};

const createRedisRateLimiter = (prefix: string, windowSeconds: number, max: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `ratelimit:${prefix}:${clientKey(req)}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (count > max) {
        return res.status(429).json({
          success: false,
          statusCode: 429,
          message: "Too many requests, try again later",
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const chatsRateLimit = createRedisRateLimiter(
  "chats",
  env.rateLimitChatWindowSeconds,
  env.rateLimitChatMax
);

export const categoriesRateLimit = createRedisRateLimiter(
  "categories",
  env.rateLimitCategoriesWindowSeconds,
  env.rateLimitCategoriesMax
);

export const workersRateLimit = createRedisRateLimiter(
  "workers",
  env.rateLimitWorkersWindowSeconds,
  env.rateLimitWorkersMax
);
