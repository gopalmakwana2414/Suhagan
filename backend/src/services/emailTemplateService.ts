import { env } from "../config/env";

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
