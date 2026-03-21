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
};
