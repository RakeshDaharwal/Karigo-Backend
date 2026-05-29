const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: toNumber(process.env.REDIS_PORT, 6379),
  redisUsername: process.env.REDIS_USERNAME || "",
  redisPassword: process.env.REDIS_PASSWORD || "",
  redisDb: toNumber(process.env.REDIS_DB, 0),
  port: toNumber(process.env.PORT, 5004),
  NODE_ENV: process.env.NODE_ENV || "development",
  otpTtlSeconds: toNumber(process.env.OTP_TTL_SECONDS, 300),
  otpCooldownSeconds: toNumber(process.env.OTP_COOLDOWN_SECONDS, 30),
  otpMobileLimitMax: toNumber(process.env.OTP_MOBILE_LIMIT_MAX, 5),
  otpMobileLimitWindowSeconds: toNumber(
    process.env.OTP_MOBILE_LIMIT_WINDOW_SECONDS,
    3600
  ),
  otpIpLimitMax: toNumber(process.env.OTP_IP_LIMIT_MAX, 20),
  otpIpLimitWindowSeconds: toNumber(
    process.env.OTP_IP_LIMIT_WINDOW_SECONDS,
    60
  ),
  otpMaxAttempts: toNumber(process.env.OTP_MAX_ATTEMPTS, 5),

  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY || "",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || "karigo",

  rateLimitChatWindowSeconds: toNumber(
    process.env.RATE_LIMIT_CHAT_WINDOW_SECONDS,
    900
  ),
  rateLimitChatMax: toNumber(process.env.RATE_LIMIT_CHAT_MAX, 300),
  rateLimitCategoriesWindowSeconds: toNumber(
    process.env.RATE_LIMIT_CATEGORIES_WINDOW_SECONDS,
    900
  ),
  rateLimitCategoriesMax: toNumber(process.env.RATE_LIMIT_CATEGORIES_MAX, 200),
  rateLimitWorkersWindowSeconds: toNumber(
    process.env.RATE_LIMIT_WORKERS_WINDOW_SECONDS,
    900
  ),
  rateLimitWorkersMax: toNumber(process.env.RATE_LIMIT_WORKERS_MAX, 120),
};
