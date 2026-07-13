import { env } from "../config/env.js";

interface EmailOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailData {
  customerName: string;
  orderId: string;
  orderDate: Date;
  items: EmailOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
}

const GOLD = "#b8860b";
const GOLD_LIGHT = "#fff9ec";
const TEXT_DARK = "#1f1f1f";
const TEXT_MUTED = "#555555";
const BORDER_COLOR = "#e5e7eb";

export const getOrderConfirmationTemplate = (data: OrderConfirmationEmailData): string => {
  const orderIdShort = data.orderId.slice(-8).toUpperCase();
  const formattedDate = new Date(data.orderDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate expected delivery: Order date + 5 days
  const deliveryDate = new Date(data.orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format currency
  const inr = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

  // Build items rows
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px 10px; border-bottom: 1px solid ${BORDER_COLOR}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK};">
          <div style="font-weight: 600;">${item.name}</div>
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid ${BORDER_COLOR}; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK};">
          ${item.quantity}
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid ${BORDER_COLOR}; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK};">
          ${inr(item.price)}
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid ${BORDER_COLOR}; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: ${TEXT_DARK};">
          ${inr(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your KAUMUDI Order Confirmation</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            padding: 10px !important;
          }
          .col {
            display: block !important;
            width: 100% !important;
            padding: 10px 0 !important;
          }
        }
      </style>
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f4f5; padding: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <!-- Main Box -->
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="background-color: #ffffff; border-bottom: 3px double ${GOLD}; padding: 30px 20px;">
                  <img src="${env.FRONTEND_URL}/kaumodi.png" alt="KAUMUDI" style="height: 50px; border: none; outline: none; display: block; margin: 0 auto;" />
                </td>
              </tr>

              <!-- Email Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <!-- Greeting -->
                  <h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">
                    Hello ${data.customerName},
                  </h2>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
                    Thank you for shopping with <strong>KAUMUDI</strong>. We are delighted to confirm that your order has been successfully placed and is now being processed by our design team in Surat.
                  </p>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 30px;">
                    Please find your invoice attached as a PDF.
                  </p>

                  <!-- Order Status Box -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td class="col" width="50%" valign="top" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                              <div style="color: ${GOLD}; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;">Order Info</div>
                              <div style="color: ${TEXT_DARK}; font-weight: 600;">Order ID: #${orderIdShort}</div>
                              <div style="color: ${TEXT_MUTED};">Placed on: ${formattedDate}</div>
                              <div style="color: ${TEXT_MUTED};">Payment: ${data.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</div>
                            </td>
                            <td class="col" width="50%" valign="top" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                              <div style="color: ${GOLD}; font-weight: bold; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;">Delivery Status</div>
                              <div style="color: ${TEXT_DARK}; font-weight: 600;">Expected Delivery:</div>
                              <div style="color: ${TEXT_DARK};">${formattedDeliveryDate}</div>
                              <div style="color: #22c55e; font-weight: bold; text-transform: uppercase; font-size: 12px;">Payment: ${data.paymentStatus}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section Title -->
                  <h3 style="font-size: 18px; border-bottom: 2px solid ${GOLD}; padding-bottom: 8px; margin-bottom: 15px; color: ${TEXT_DARK}; font-weight: normal; font-style: italic;">
                    Order Details
                  </h3>

                  <!-- Items Table -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f8fafc; border-bottom: 2px solid ${GOLD};">
                        <th align="left" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD};">Item</th>
                        <th align="center" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 50px;">Qty</th>
                        <th align="right" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 80px;">Price</th>
                        <th align="right" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 100px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr>
                        <td colspan="2"></td>
                        <td style="padding: 20px 10px 10px 10px; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_MUTED};">Subtotal:</td>
                        <td style="padding: 20px 10px 10px 10px; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: ${TEXT_DARK};">${inr(data.totalAmount)}</td>
                      </tr>
                      <tr style="border-top: 1px double ${GOLD};">
                        <td colspan="2"></td>
                        <td style="padding: 15px 10px; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: ${GOLD};">Grand Total:</td>
                        <td style="padding: 15px 10px; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: bold; color: ${GOLD};">${inr(data.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Shipping Section -->
                  <h3 style="font-size: 18px; border-bottom: 2px solid ${GOLD}; padding-bottom: 8px; margin-bottom: 15px; color: ${TEXT_DARK}; font-weight: normal; font-style: italic;">
                    Shipping Address
                  </h3>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${TEXT_MUTED}; background-color: #fafafa; padding: 15px; border-radius: 6px; border: 1px solid ${BORDER_COLOR}; margin-bottom: 30px;">
                    ${data.address.replace(/\n/g, "<br>")}
                  </p>

                  <!-- Contact Support Info -->
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${TEXT_MUTED}; text-align: center; margin-top: 40px; border-top: 1px solid ${BORDER_COLOR}; padding-top: 20px;">
                    If you have any questions, feel free to contact our support team at 
                    <a href="mailto:g91652251@gmail.com" style="color: ${GOLD}; text-decoration: none; font-weight: bold;">g91652251@gmail.com</a> or call 
                    <a href="tel:+918959465264" style="color: ${GOLD}; text-decoration: none; font-weight: bold;">+91 89594 65264</a>.
                  </p>
                </td>
              </tr>

              <!-- Footer Banner -->
              <tr>
                <td style="background-color: ${GOLD}; color: #ffffff; text-align: center; padding: 25px 20px;">
                  <p style="margin: 0; font-size: 16px; font-style: italic; font-weight: bold; letter-spacing: 1px;">Thank You for Shopping with KAUMUDI ❤️</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">www.kaumudi.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Premium email wrapper
const wrapPremiumTemplate = (title: string, bodyHtml: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            padding: 10px !important;
          }
        }
      </style>
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f4f5; padding: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
              <tr>
                <td align="center" style="background-color: #ffffff; border-bottom: 3px double ${GOLD}; padding: 30px 20px;">
                  <img src="${env.FRONTEND_URL}/kaumodi.png" alt="KAUMUDI" style="height: 50px; border: none; outline: none; display: block; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="background-color: ${GOLD}; color: #ffffff; text-align: center; padding: 25px 20px;">
                  <p style="margin: 0; font-size: 16px; font-style: italic; font-weight: bold; letter-spacing: 1px;">Luxury Handcrafted Sarees ❤️</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase;">www.kaumudi.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getRegistrationOTPTemplate = (otp: string): string => {
  return wrapPremiumTemplate(
    "Verify Your Email",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Verify Your Registration</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Thank you for starting your journey with KAUMUDI. Use the verification code below to complete your registration. This code is valid for 10 minutes.
     </p>
     <div style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 25px;">
       <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: ${GOLD};">${otp}</span>
     </div>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${TEXT_MUTED};">
       If you did not request this verification code, please ignore this email.
     </p>`
  );
};

export const getForgotPasswordOTPTemplate = (otp: string): string => {
  return wrapPremiumTemplate(
    "Reset Your Password",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Password Reset Request</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       We received a request to reset your KAUMUDI account password. Please use the verification code below to complete the reset process. This code is valid for 10 minutes.
     </p>
     <div style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 25px;">
       <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: ${GOLD};">${otp}</span>
     </div>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${TEXT_MUTED};">
       If you did not make this request, you can safely ignore this email; your password will remain secure.
     </p>`
  );
};

export const getEmailChangeOTPTemplate = (otp: string): string => {
  return wrapPremiumTemplate(
    "Confirm Your New Email",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Confirm Email Change</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       You requested to change your email address on your KAUMUDI account. Use the code below to verify your new email. This code is valid for 10 minutes.
     </p>
     <div style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 25px;">
       <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: ${GOLD};">${otp}</span>
     </div>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${TEXT_MUTED};">
       Your email address will not be updated until you enter this code. If you did not initiate this change, please contact us immediately.
     </p>`
  );
};

export const getPasswordChangedTemplate = (name: string): string => {
  return wrapPremiumTemplate(
    "Password Changed Successfully",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Hello ${name},</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Your password for your KAUMUDI account was changed successfully.
     </p>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       If you did this, you can safely disregard this email.
     </p>
     <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px;">
       <strong>Security Warning:</strong> If you did not make this change, please reset your password immediately or contact our security team.
     </div>`
  );
};

export const getWelcomeEmailTemplate = (name: string): string => {
  return wrapPremiumTemplate(
    "Welcome to KAUMUDI",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Welcome, ${name}! 🌸</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Thank you for creating an account with <strong>KAUMUDI</strong>. Explore our handcrafted collection of Banarasi, Kanjivaram, Silk, and Designer sarees, curated for every beautiful occasion.
     </p>
     <div style="text-align: center; margin: 30px 0;">
       <a href="${env.FRONTEND_URL}/shop" style="display:inline-block;background:${GOLD};color:#fff;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:bold;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;letter-spacing:1px;box-shadow: 0 4px 6px rgba(212,175,55,0.2);">
         Start Exploring
       </a>
     </div>`
  );
};

export const getAccountLockedTemplate = (name: string, lockDurationMinutes: number): string => {
  return wrapPremiumTemplate(
    "Your Account Has Been Temporarily Locked",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: #721c24; font-style: italic;">Security Alert</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Hi ${name},
     </p>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       We detected multiple consecutive failed login attempts on your account. For your security, your account has been temporarily locked for <strong>${lockDurationMinutes} minutes</strong>.
     </p>
     <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px;">
       Your account will automatically unlock after this period. If you did not perform these login attempts, we highly recommend resetting your password immediately once the account is unlocked.
     </div>`
  );
};

export const getPasswordResetSuccessfulTemplate = (name: string): string => {
  return wrapPremiumTemplate(
    "Password Reset Successful",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Hello ${name},</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Your password has been successfully reset using the one-time verification code. You can now log back into your account.
     </p>
     <div style="text-align: center; margin: 30px 0;">
       <a href="${env.FRONTEND_URL}/login" style="display:inline-block;background:${GOLD};color:#fff;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:bold;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;letter-spacing:1px;">
         Login Now
       </a>
     </div>`
  );
};

export const getAdminLoginOTPTemplate = (otp: string): string => {
  return wrapPremiumTemplate(
    "Admin Login Verification Code",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic;">Confirm Admin Login</h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Use the code below to complete your admin login. This code is valid for 5 minutes.
     </p>
     <div style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 25px;">
       <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: ${GOLD};">${otp}</span>
     </div>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${TEXT_MUTED};">
       If you did not attempt to log in to the admin panel, please change your password immediately.
     </p>`
  );
};

export const getAdminOrderAlertTemplate = (order: any): string => {
  const orderIdShort = order._id.toString().slice(-8).toUpperCase();
  const year = new Date(order.createdAt).getFullYear();
  const formattedDateTime = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const inr = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

  // Totals calculations
  let subtotal = 0;
  order.items.forEach((item: any) => {
    subtotal += item.price * item.quantity;
  });
  const discount = order.discountAmount || 0;
  const shipping = Math.max(0, order.totalAmount + discount - subtotal);
  const tax = 0;
  const grandTotal = order.totalAmount;
  const couponUsed = order.couponCode || null;

  const itemsHtml = order.items
    .map((item: any) => {
      const product = item.product || {};
      const imgUrl = product.thumbnail?.url || "";
      const name = product.name || "Saree Product";
      const sku = product.sku || "N/A";
      const qty = item.quantity;
      const price = item.price;
      const total = price * qty;

      const imgTag = imgUrl
        ? `<img src="${imgUrl}" alt="${name}" width="50" height="50" style="display: block; border-radius: 4px; border: 1px solid #e5e7eb; object-fit: cover;" />`
        : `<div style="width: 50px; height: 50px; background-color: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; line-height: 50px; text-align: center; font-size: 20px;">🛍️</div>`;

      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 10px; vertical-align: middle;">
            ${imgTag}
          </td>
          <td style="padding: 12px 10px; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; color: ${TEXT_DARK};">${name}</div>
            <div style="font-size: 12px; color: ${TEXT_MUTED}; margin-top: 2px;">SKU: ${sku}</div>
          </td>
          <td align="center" style="padding: 12px 10px; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK};">
            ${qty}
          </td>
          <td align="right" style="padding: 12px 10px; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK};">
            ${inr(price)}
          </td>
          <td align="right" style="padding: 12px 10px; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: ${TEXT_DARK};">
            ${inr(total)}
          </td>
        </tr>
      `;
    })
    .join("");

  return wrapPremiumTemplate(
    "New Order Received",
    `<h2 style="margin-top: 0; font-size: 22px; font-weight: normal; color: ${TEXT_DARK}; font-style: italic; border-bottom: 1px solid ${BORDER_COLOR}; padding-bottom: 12px; margin-bottom: 20px;">
       New Order Alert
     </h2>
     <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${TEXT_MUTED}; margin-bottom: 25px;">
       Hello Admin,<br><br>
       A new order has been placed on the Kaumudi website.
     </p>

     <!-- Quick Action Button -->
     <div style="text-align: center; margin: 25px 0;">
       <a href="${env.FRONTEND_URL}/admin/orders" style="display: inline-block; background-color: ${GOLD}; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 30px; font-size: 14px; letter-spacing: 0.5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-shadow: 0 4px 10px rgba(184, 134, 11, 0.2);">
         Open Admin Dashboard
       </a>
     </div>

     <!-- Order Details Card -->
     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${GOLD_LIGHT}; border: 1px solid #faebcc; border-radius: 6px; margin-bottom: 24px;">
       <tr>
         <td style="padding: 16px 20px;">
           <h4 style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; letter-spacing: 1px;">Order Details</h4>
           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${TEXT_DARK};">
             <tr>
               <td width="35%" style="font-weight: 600; padding: 3px 0;">Order ID:</td>
               <td style="padding: 3px 0;">#KM${year}${orderIdShort} <span style="font-size: 11px; color: ${TEXT_MUTED};">(${order._id.toString()})</span></td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Date & Time:</td>
               <td style="padding: 3px 0;">${formattedDateTime}</td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Payment Method:</td>
               <td style="padding: 3px 0;">${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Payment Status:</td>
               <td style="padding: 3px 0;">
                 <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; ${
                   order.paymentStatus === "paid"
                     ? "background-color: #d1fae5; color: #065f46;"
                     : order.paymentStatus === "pending"
                     ? "background-color: #fef3c7; color: #92400e;"
                     : "background-color: #fee2e2; color: #991b1b;"
                 }">${order.paymentStatus}</span>
               </td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Order Status:</td>
               <td style="padding: 3px 0;">
                 <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; background-color: #e0f2fe; color: #0369a1;">${
                   order.orderStatus
                 }</span>
               </td>
             </tr>
           </table>
         </td>
       </tr>
     </table>

     <!-- Customer Details Card -->
     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid ${BORDER_COLOR}; border-radius: 6px; margin-bottom: 24px;">
       <tr>
         <td style="padding: 16px 20px;">
           <h4 style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; letter-spacing: 1px;">Customer Details</h4>
           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${TEXT_DARK};">
             <tr>
               <td width="35%" style="font-weight: 600; padding: 3px 0;">Customer Name:</td>
               <td style="padding: 3px 0;">${order.user?.name || "N/A"}</td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Email Address:</td>
               <td style="padding: 3px 0;"><a href="mailto:${order.user?.email || ""}" style="color: ${GOLD}; text-decoration: none;">${order.user?.email || "N/A"}</a></td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Mobile Number:</td>
               <td style="padding: 3px 0;">${order.user?.mobile || order.shippingAddress?.mobileNumber || "N/A"}</td>
             </tr>
             <tr>
               <td valign="top" style="font-weight: 600; padding: 3px 0;">Shipping Address:</td>
               <td style="padding: 3px 0;">
                 ${order.shippingAddress?.addressLine1 || ""}${
                   order.shippingAddress?.addressLine2 ? ", " + order.shippingAddress.addressLine2 : ""
                 }<br>
                 ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${
                   order.shippingAddress?.postalCode || ""
                 }<br>
                 ${order.shippingAddress?.country || "India"}
               </td>
             </tr>
           </table>
         </td>
       </tr>
     </table>

     <!-- Delivery Details Card -->
     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid ${BORDER_COLOR}; border-radius: 6px; margin-bottom: 24px;">
       <tr>
         <td style="padding: 16px 20px;">
           <h4 style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; letter-spacing: 1px;">Delivery Details</h4>
           <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${TEXT_DARK};">
             <tr>
               <td width="35%" style="font-weight: 600; padding: 3px 0;">Recipient Name:</td>
               <td style="padding: 3px 0;">${order.shippingAddress?.fullName || "N/A"}</td>
             </tr>
             <tr>
               <td valign="top" style="font-weight: 600; padding: 3px 0;">Full Address:</td>
               <td style="padding: 3px 0;">
                 ${order.shippingAddress?.addressLine1 || ""}${
                   order.shippingAddress?.addressLine2 ? ", " + order.shippingAddress.addressLine2 : ""
                 }, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}, ${
                   order.shippingAddress?.country || "India"
                 }
               </td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">PIN Code:</td>
               <td style="padding: 3px 0;">${order.shippingAddress?.postalCode || "N/A"}</td>
             </tr>
             <tr>
               <td style="font-weight: 600; padding: 3px 0;">Phone Number:</td>
               <td style="padding: 3px 0;">${order.shippingAddress?.mobileNumber || "N/A"}</td>
             </tr>
           </table>
         </td>
       </tr>
     </table>

     <!-- Products Purchased -->
     <h4 style="margin: 24px 0 12px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; letter-spacing: 1px; border-bottom: 2px solid ${GOLD}; padding-bottom: 6px;">
       Products Purchased
     </h4>
     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
       <thead>
         <tr style="background-color: #f8fafc; border-bottom: 1px solid ${BORDER_COLOR};">
           <th align="left" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 60px;">Image</th>
           <th align="left" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${GOLD};">Product Details</th>
           <th align="center" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 50px;">Qty</th>
           <th align="right" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 80px;">Price</th>
           <th align="right" style="padding: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${GOLD}; width: 100px;">Total</th>
         </tr>
       </thead>
       <tbody>
         ${itemsHtml}
       </tbody>
     </table>

     <!-- Pricing Summary -->
     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEXT_DARK}; margin-top: 15px;">
       <tr>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_MUTED};">Subtotal:</td>
         <td align="right" style="padding: 4px 10px; width: 120px; color: ${TEXT_DARK};">${inr(subtotal)}</td>
       </tr>
       ${
         discount > 0
           ? `
       <tr>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_MUTED}; font-style: italic;">Discount ${
               couponUsed ? `(${couponUsed})` : ""
             }:</td>
         <td align="right" style="padding: 4px 10px; color: #dc2626;">-${inr(discount)}</td>
       </tr>
       `
           : ""
       }
       <tr>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_MUTED};">Shipping Charge:</td>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_DARK};">${shipping > 0 ? inr(shipping) : "Free"}</td>
       </tr>
       <tr>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_MUTED};">Tax:</td>
         <td align="right" style="padding: 4px 10px; color: ${TEXT_DARK};">${inr(tax)}</td>
       </tr>
       <tr style="border-top: 1px solid ${BORDER_COLOR};">
         <td align="right" style="padding: 12px 10px 4px 10px; font-weight: bold; font-size: 16px; color: ${GOLD};">Grand Total:</td>
         <td align="right" style="padding: 12px 10px 4px 10px; font-weight: bold; font-size: 18px; color: ${GOLD};">${inr(grandTotal)}</td>
       </tr>
     </table>`
  );
};


