import axios from "axios";
import { env } from "../config/env";
import { logError, logInfo } from "./logger.utils";

// Ensures an Indian mobile number is in E.164 format expected by the provider.
const toE164 = (mobile: string) => {
  const trimmed = mobile.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

export const sendOtpSms = async (mobile: string, otp: string) => {
  if (env.NODE_ENV !== "production") {
    logInfo("Skipping SMS in non-production. OTP logged only", { mobile, otp });
    return;
  }

  if (!env.smsApiKey || !env.smsOtpTemplateId) {
    throw new Error("SMS service is not configured");
  }

  try {
    await axios.post(
      `${env.smsBaseUrl}/otp/send`,
      {
        phoneNumber: toE164(mobile),
        templateId: env.smsOtpTemplateId,
        variables: { otp, appName: env.smsAppName },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.smsApiKey,
        },
        timeout: 10000,
      }
    );

    logInfo("Karigo login OTP sent via SMS", { mobile });
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data ?? error.message
      : (error as Error).message;
    logError("Failed to send login OTP via SMS", { mobile, error: message });

    const err = new Error("Failed to send OTP. Please try again.") as Error & {
      statusCode: number;
    };
    err.statusCode = 502;
    throw err;
  }
};
