import twilio from "twilio";

// Phone verification through Twilio Verify (https://www.twilio.com/docs/verify).
// In development, if Twilio isn't configured, any number is accepted with the code 123456.

const DEV_CODE = "123456";

function config() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) return null;
  return { client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), serviceSid: TWILIO_VERIFY_SERVICE_SID };
}

function devFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

export async function sendVerificationCode(phone: string): Promise<void> {
  const cfg = config();
  if (!cfg) {
    if (!devFallbackAllowed()) throw new Error("Twilio is not configured");
    console.warn(`[sms] Twilio not configured. Dev code for ${phone}: ${DEV_CODE}`);
    return;
  }
  await cfg.client.verify.v2.services(cfg.serviceSid).verifications.create({ to: phone, channel: "sms" });
}

export async function checkVerificationCode(phone: string, code: string): Promise<boolean> {
  const cfg = config();
  if (!cfg) {
    if (!devFallbackAllowed()) throw new Error("Twilio is not configured");
    return code === DEV_CODE;
  }
  try {
    const check = await cfg.client.verify.v2
      .services(cfg.serviceSid)
      .verificationChecks.create({ to: phone, code });
    return check.status === "approved";
  } catch {
    // Twilio returns 404 when the verification expired or was already used.
    return false;
  }
}
