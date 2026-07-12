/**
 * Sends all our emails via SMTP (Nodemailer) — welcome, order
 * confirmations, password reset, contact form, etc. Configure
 * SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM in .env,
 * works with Gmail, SendGrid, Mailgun, SES, Brevo, whatever you use.
 *
 * Every function throws on failure instead of swallowing errors, so
 * call sites wrap these in try/catch or .catch() rather than letting
 * a broken email provider take down the request that triggered it.
 */

import nodemailer from "nodemailer";
import { env } from "../config/env";
import { getOrderConfirmationTemplate } from "./emailTemplateService";

// created lazily so just importing this file doesn't blow up if SMTP
// env vars aren't set yet — only errors once you actually try to send
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment."
    );
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for port 465, false for 587/25 (STARTTLS)
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
};

const BRAND_COLOR = "#d4af37";

const wrapTemplate = (title: string, bodyHtml: string) => `
  <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
    <div style="background: ${BRAND_COLOR}; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">KAUMUDI</h1>
    </div>
    <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #eee; border-top: none;">
      <h2 style="margin-top: 0; color: #2b2b2b;">${title}</h2>
      ${bodyHtml}
    </div>
    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">
      KAUMUDI — Luxury Sarees, Surat, India
    </p>
  </div>
`;

const send = async (to: string, subject: string, html: string, text?: string) => {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"KAUMUDI" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });
};

// welcome email
export const sendWelcomeEmail = async ({
  to,
  customerName,
}: {
  to: string;
  customerName: string;
}): Promise<void> => {
  const html = wrapTemplate(
    `Welcome, ${customerName}! 🌸`,
    `<p>Thank you for creating an account with KAUMUDI. Explore our handcrafted
     collection of Banarasi, Kanjivaram, Silk and Designer sarees, curated for
     every occasion.</p>
     <p><a href="${env.FRONTEND_URL}/shop" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">
       Start Shopping
     </a></p>`
  );

  await send(to, "Welcome to KAUMUDI 🌸", html);
};

// otp email
export const sendOTPEmail = async ({
  to,
  otp,
}: {
  to: string;
  otp: string;
}): Promise<void> => {
  const html = wrapTemplate(
    "Your Verification Code",
    `<p>Use the code below to verify your request. This code expires in 10 minutes.</p>
     <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0;">${otp}</p>
     <p style="color:#999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>`
  );

  await send(to, "Your KAUMUDI verification code", html);
};

// reset password email
export const sendResetPasswordEmail = async ({
  to,
  customerName,
  resetUrl,
}: {
  to: string;
  customerName: string;
  resetUrl: string;
}): Promise<void> => {
  const html = wrapTemplate(
    "Reset Your Password",
    `<p>Hi ${customerName},</p>
     <p>We received a request to reset your KAUMUDI account password. This link
     is valid for 30 minutes.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">
       Reset Password
     </a></p>
     <p style="color:#999; font-size: 13px; margin-top: 20px;">
       If you didn't request a password reset, you can safely ignore this
       email — your password will remain unchanged.
     </p>
     <p style="color:#999; font-size: 12px; word-break: break-all;">${resetUrl}</p>`
  );

  await send(to, "Reset your KAUMUDI password", html);
};

// order status update email
export const sendOrderStatusEmail = async ({
  to,
  customerName,
  orderId,
  status,
}: {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
}): Promise<void> => {
  const html = wrapTemplate(
    "Your Order Status Has Been Updated",
    `<p>Hi ${customerName},</p>
     <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> is now:</p>
     <p style="font-size: 20px; font-weight: bold; text-transform: capitalize; color: ${BRAND_COLOR};">${status}</p>
     <p><a href="${env.FRONTEND_URL}/orders/${orderId}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">
       Track Your Order
     </a></p>`
  );

  await send(to, `Order Update: ${status}`, html);
};

// customer order confirmation email
export const sendOrderConfirmationEmail = async (data: {
  to: string;
  customerName: string;
  orderId: string;
  orderDate: Date;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  pdfBuffer: Buffer;
}): Promise<void> => {
  const html = getOrderConfirmationTemplate({
    customerName: data.customerName,
    orderId: data.orderId,
    orderDate: data.orderDate,
    items: data.items,
    totalAmount: data.totalAmount,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    address: data.address,
  });

  const orderIdShort = data.orderId.slice(-8).toUpperCase();
  const mailer = getTransporter();

  // Retry logic with backoff for SMTP errors
  let attempts = 0;
  const maxAttempts = 3;
  let delay = 1000;

  while (attempts < maxAttempts) {
    try {
      await mailer.sendMail({
        from: `"KAUMUDI" <${env.EMAIL_FROM}>`,
        to: data.to,
        subject: `Your KAUMUDI Order Confirmation & Invoice (#${orderIdShort})`,
        html,
        attachments: [
          {
            filename: `KAUMUDI-Invoice-${orderIdShort}.pdf`,
            content: data.pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      return;
    } catch (err: any) {
      attempts++;
      console.error(`SMTP attempt ${attempts} failed to send order confirmation email:`, err.message);
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to send order confirmation email after ${maxAttempts} attempts. Last error: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// admin new order alert
export const sendAdminOrderAlert = async (data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
}): Promise<void> => {
  const html = wrapTemplate(
    "🛍️ New Order Received",
    `<p><strong>Order:</strong> #${data.orderId.slice(-8).toUpperCase()}</p>
     <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
     <p><strong>Items:</strong> ${data.itemCount}</p>
     <p><strong>Total:</strong> ₹${data.totalAmount.toLocaleString("en-IN")}</p>
     <p><strong>Payment:</strong> ${data.paymentMethod}</p>
     <p><a href="${env.FRONTEND_URL}/admin/orders" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">
       View in Admin Panel
     </a></p>`
  );

  await send(env.ADMIN_EMAIL, `New Order: ₹${data.totalAmount.toLocaleString("en-IN")}`, html);
};

// contact form email
export const sendContactEmail = async (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<void> => {
  const html = wrapTemplate(
    "📩 New Contact Form Submission",
    `<p><strong>Name:</strong> ${data.name}</p>
     <p><strong>Email:</strong> ${data.email}</p>
     ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
     <p><strong>Message:</strong></p>
     <p style="white-space: pre-wrap; background:#f8f8f8; padding:12px; border-radius:8px;">${data.message}</p>`
  );

  // Sent to the store's admin inbox — the customer does not receive a copy
  // here since this is an internal notification, not a customer-facing email.
  await send(env.ADMIN_EMAIL, `Contact Form: ${data.name}`, html);
};

export default {
  sendWelcomeEmail,
  sendOTPEmail,
  sendResetPasswordEmail,
  sendOrderStatusEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderAlert,
  sendContactEmail,
};
