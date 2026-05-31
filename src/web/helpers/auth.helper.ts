import redis from "../../config/redis.conn";
import { env } from "../../config/env";

const OTP_TTL_SECONDS = env.otpTtlSeconds;
const OTP_COOLDOWN_SECONDS = env.otpCooldownSeconds;
const OTP_MOBILE_LIMIT_WINDOW_SECONDS = env.otpMobileLimitWindowSeconds;
const OTP_IP_LIMIT_WINDOW_SECONDS = env.otpIpLimitWindowSeconds;

export const BYPASS_OTP = "123456";

export const normalizeOtp = (otp: string | number) => String(otp).trim();

export const isBypassOtp = (otp: string | number) =>
  normalizeOtp(otp) === BYPASS_OTP;

export const otpsMatch = (
  stored: string | number,
  submitted: string | number
) => normalizeOtp(stored) === normalizeOtp(submitted);

const getOtpKey = (mobile: string) => `otp:${mobile}`;
const getCooldownKey = (mobile: string) => `otp_cooldown:${mobile}`;
const getMobileLimitKey = (mobile: string) => `otp_limit:${mobile}`;
const getIpLimitKey = (ip: string) => `otp_ip_limit:${ip}`;

export const getOtpRecord = async (mobile: string) => {
  const raw = await redis.get(getOtpKey(mobile));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { otp: string; attempts: number };
    if (!parsed.otp || typeof parsed.attempts !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setOtpRecord = async (
  mobile: string,
  otpPayload: { otp: string; attempts: number }
) => {
  await redis.set(
    getOtpKey(mobile),
    JSON.stringify(otpPayload),
    "EX",
    OTP_TTL_SECONDS
  );
};

export const updateOtpAttemptsKeepingTtl = async (
  mobile: string,
  attempts: number
) => {
  const key = getOtpKey(mobile);
  const [existingOtp, ttlSeconds] = await Promise.all([
    getOtpRecord(mobile),
    redis.ttl(key),
  ]);

  if (!existingOtp || ttlSeconds === -2) {
    return false;
  }

  const updatedPayload = JSON.stringify({
    otp: existingOtp.otp,
    attempts,
  });

  if (ttlSeconds > 0) {
    await redis.set(key, updatedPayload, "EX", ttlSeconds);
    return true;
  }

  await redis.set(key, updatedPayload);
  return true;
};

export const deleteOtpRecord = async (mobile: string) => {
  await redis.del(getOtpKey(mobile));
};

export const setOtpCooldown = async (mobile: string) => {
  await redis.set(getCooldownKey(mobile), "1", "EX", OTP_COOLDOWN_SECONDS);
};

export const isOtpCooldownActive = async (mobile: string) => {
  const exists = await redis.exists(getCooldownKey(mobile));
  return exists === 1;
};

export const incrementMobileOtpLimit = async (mobile: string) => {
  const key = getMobileLimitKey(mobile);
  const currentCount = await redis.incr(key);
  if (currentCount === 1) {
    await redis.expire(key, OTP_MOBILE_LIMIT_WINDOW_SECONDS);
  }
  return currentCount;
};

export const incrementIpOtpLimit = async (ip: string) => {
  const key = getIpLimitKey(ip);
  const currentCount = await redis.incr(key);
  if (currentCount === 1) {
    await redis.expire(key, OTP_IP_LIMIT_WINDOW_SECONDS);
  }
  return currentCount;
};
