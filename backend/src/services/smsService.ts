/**
 * SMS Service — Handles sending mobile verification OTPs.
 * Under development, it logs OTPs to the console.
 * In production, it can integrate with SMS API providers like MSG91 or Twilio.
 */

export const sendMobileOTP = async ({
  mobile,
  otp,
}: {
  mobile: string;
  otp: string;
}): Promise<void> => {
  // Always log in console for development/debugging
  console.log(`\n--- [SMS SERVICE] MOBILE OTP ---`);
  console.log(`Recipient Mobile: ${mobile}`);
  console.log(`Verification Code: ${otp}`);
  console.log(`Expires in: 5 minutes`);
  console.log(`---------------------------------\n`);

  const smsApiKey = process.env.SMS_API_KEY;
  const smsSenderId = process.env.SMS_SENDER_ID;
  const smsTemplateId = process.env.SMS_TEMPLATE_ID;

  if (smsApiKey && smsSenderId) {
    // Standard integration architecture placeholder (e.g., MSG91, Twilio, or other HTTP-based providers)
    try {
      // In a real setup, we'd make an HTTP request here:
      // await axios.post('https://api.msg91.com/api/v5/flow/', {
      //   template_id: smsTemplateId,
      //   sender: smsSenderId,
      //   recipients: [{ mobiles: mobile, var1: otp }]
      // }, { headers: { authkey: smsApiKey } });
    } catch (err: any) {
      console.error("SMS API dispatch failed:", err.message);
      // We don't throw in dev, but in production we might want to throw to let registration know it failed
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to send SMS OTP. Please try again later.");
      }
    }
  }
};

export default {
  sendMobileOTP,
};
