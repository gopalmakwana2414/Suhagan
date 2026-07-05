import PDFDocument from "pdfkit";
import { Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname isn't available in ESM (package.json has "type": "module"),
// so this is the ESM-safe way to get it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLD = "#b8860b";
const GOLD_DARK = "#9c7419";
const DARK = "#1f1f1f";
const GRAY = "#8a8a8a";
const LIGHT_BG = "#fff8e7";
const BORDER = "#eeeeee";
const PAGE_LEFT = 50;
const PAGE_RIGHT = 545;
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;

// drop logo.png / signature.png in src/assets to use them — falls back
// to plain text if either file is missing
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");
const SIGNATURE_PATH = path.join(__dirname, "..", "assets", "signature.png");

// Helvetica can't render Hindi/Devanagari, so addresses with non-Latin
// text came out as garbled bytes. This font covers both Devanagari and
// standard Latin, so English addresses still look the same as before.
const UNICODE_FONT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "fonts",
  "NotoSansDevanagari.ttf"
);
const UNICODE_FONT = "UnicodeSafe";
const COMPANY_NAME = "Suhagan Sarees";
const COMPANY_TAGLINE = "Premium Handcrafted Sarees from Surat";
const COMPANY_ADDRESS = "Suhagan Sarees, Ring Road, Surat, Gujarat - 395002";
const COMPANY_EMAIL = "g91652251@gmail.com";
const COMPANY_PHONE = "+91 89594 65264";

interface InvoiceOrder {
  _id: any;
  items: {
    product: { name?: string; sku?: string } | any;
    quantity: number;
    price: number;
  }[];
  totalItems: number;
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  shippingAddress: {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  user: { name: string; email: string };
}

// Currency formatter — used everywhere a Rupee amount is printed so the
// invoice is consistent (thousands separators, no decimals for whole INR).
const inr = (amount: number) =>
  `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;

/**
 * Streams a branded, production-quality PDF invoice for the given order
 * directly to the HTTP response.
 */
export const generateInvoicePDF = (order: InvoiceOrder, res: Response) => {
  const doc = new PDFDocument({ size: "A4", margin: 0 });

  const orderId = order._id.toString().slice(-8).toUpperCase();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Suhagan-Invoice-${orderId}.pdf`
  );

  doc.pipe(res);

  // customer-entered fields use this font instead of Helvetica so
  // non-Latin text renders correctly; falls back to Helvetica if missing
  const hasUnicodeFont = fs.existsSync(UNICODE_FONT_PATH);
  if (hasUnicodeFont) {
    doc.registerFont(UNICODE_FONT, UNICODE_FONT_PATH);
  }
  const safeFont = hasUnicodeFont ? UNICODE_FONT : "Helvetica";

  // header band
  const headerHeight = 118;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(GOLD);

  const logoExists = fs.existsSync(LOGO_PATH);

  if (logoExists) {
    // Logo image, vertically centered in the header band.
    try {
      doc.image(LOGO_PATH, PAGE_LEFT, 28, { height: 46 });
    } catch {
      renderWordmark(doc);
    }
  } else {
    renderWordmark(doc);
  }

  function renderWordmark(d: PDFKit.PDFDocument) {
    d.fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(26)
      .text(COMPANY_NAME.toUpperCase(), PAGE_LEFT, 34);
  }

  doc
    .fontSize(9.5)
    .font("Helvetica")
    .fillColor("#fdf3d8")
    .text(COMPANY_TAGLINE, PAGE_LEFT, logoExists ? 80 : 68);

  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("INVOICE", 0, 42, { align: "right", width: PAGE_RIGHT });

  // meta row — invoice #, date, status
  const metaTop = headerHeight + 30;

  const metaCol = (
    x: number,
    label: string,
    value: string,
    valueColor = DARK
  ) => {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(GRAY)
      .text(label, x, metaTop, { characterSpacing: 0.5 })
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(valueColor)
      .text(value, x, metaTop + 14);
  };

  metaCol(PAGE_LEFT, "INVOICE NUMBER", `#${orderId}`);
  metaCol(
    230,
    "ORDER DATE",
    new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  metaCol(
    410,
    "PAYMENT STATUS",
    order.paymentStatus.toUpperCase(),
    order.paymentStatus === "paid" ? "#16a34a" : "#d97706"
  );

  doc
    .moveTo(PAGE_LEFT, metaTop + 46)
    .lineTo(PAGE_RIGHT, metaTop + 46)
    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();

  // bill to / ship to
  const addrTop = metaTop + 68;
  const addr = order.shippingAddress;

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(GRAY)
    .text("BILLED TO", PAGE_LEFT, addrTop);

  doc
    .fontSize(11.5)
    .font(safeFont)
    .fillColor(DARK)
    .text(order.user?.name || addr.fullName, PAGE_LEFT, addrTop + 16);

  doc
    .fontSize(9.5)
    .font(safeFont)
    .fillColor(GRAY)
    .text(order.user?.email || "", PAGE_LEFT, addrTop + 33);

  const shipX = 310;
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(GRAY)
    .text("SHIPPING ADDRESS", shipX, addrTop);

  // Sanitize address fields defensively — strips any non-printable /
  // control characters so a bad legacy record can't corrupt the PDF
  // layout the way it did before (garbled bytes in the address block).
  const clean = (value?: string) =>
    (value || "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .trim();

  const addressLines = [
    clean(addr.fullName),
    `${clean(addr.addressLine1)}${
      addr.addressLine2 ? ", " + clean(addr.addressLine2) : ""
    }`,
    `${clean(addr.city)}, ${clean(addr.state)} - ${clean(addr.postalCode)}`,
    `Phone: ${clean(addr.mobileNumber)}`,
  ].filter(Boolean);

  doc
    .fontSize(9.5)
    .font(safeFont)
    .fillColor(DARK)
    .text(addressLines.join("\n"), shipX, addrTop + 16, {
      width: PAGE_RIGHT - shipX,
      lineGap: 3,
    });

  // items table
  let tableTop = addrTop + 120;

  doc.rect(PAGE_LEFT, tableTop, PAGE_WIDTH, 28).fill(LIGHT_BG);
  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor(GOLD_DARK)
    .text("ITEM", PAGE_LEFT + 12, tableTop + 9)
    .text("QTY", 330, tableTop + 9, { width: 50, align: "center" })
    .text("PRICE", 390, tableTop + 9, { width: 70, align: "right" })
    .text("TOTAL", 470, tableTop + 9, { width: 65, align: "right" });

  let rowY = tableTop + 28;
  const rowHeight = 26;

  order.items.forEach((item, idx) => {
    const name =
      (typeof item.product === "object" && item.product?.name) ||
      "Saree Product";
    const lineTotal = item.price * item.quantity;

    if (idx % 2 === 1) {
      doc.rect(PAGE_LEFT, rowY, PAGE_WIDTH, rowHeight).fill("#fafafa");
    }

    doc
      .fontSize(9.5)
      .font(safeFont)
      .fillColor(DARK)
      .text(name, PAGE_LEFT + 12, rowY + 8, { width: 260 })
      .text(String(item.quantity), 330, rowY + 8, {
        width: 50,
        align: "center",
      })
      .text(inr(item.price), 390, rowY + 8, { width: 70, align: "right" })
      .text(inr(lineTotal), 470, rowY + 8, { width: 65, align: "right" });

    rowY += rowHeight;
  });

  doc
    .moveTo(PAGE_LEFT, rowY + 4)
    .lineTo(PAGE_RIGHT, rowY + 4)
    .strokeColor(BORDER)
    .stroke();

  // totals block — label and value columns kept apart so "GRAND TOTAL"
  // doesn't run into its number like it used to
  const totalsLabelX = 300;
  const totalsLabelWidth = 155; // ends at x = 455
  const totalsValueX = 465;      // starts 10px after the label ends
  const totalsValueWidth = 80;   // ends at x = 545 = PAGE_RIGHT

  let totalsY = rowY + 22;

  const totalsRow = (
    label: string,
    value: string,
    opts: { bold?: boolean; muted?: boolean } = {}
  ) => {
    doc
      .fontSize(opts.bold ? 10.5 : 10)
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(opts.muted ? GRAY : DARK)
      .text(label, totalsLabelX, totalsY, {
        width: totalsLabelWidth,
        align: "right",
      })
      .text(value, totalsValueX, totalsY, {
        width: totalsValueWidth,
        align: "right",
      });
    totalsY += 20;
  };

  const subtotal =
    order.totalAmount + (order.discountAmount || 0);

  totalsRow("Subtotal", inr(subtotal), { muted: true });

  if (order.discountAmount && order.discountAmount > 0) {
    totalsRow(
      order.couponCode ? `Discount (${order.couponCode})` : "Discount",
      `- ${inr(order.discountAmount)}`,
      { muted: true }
    );
  }

  totalsRow(
    "Payment Method",
    order.paymentMethod === "COD" ? "Cash on Delivery" : "Online",
    { muted: true }
  );

  totalsY += 6;

  const grandTotalBoxHeight = 36;
  doc
    .rect(totalsLabelX, totalsY, PAGE_RIGHT - totalsLabelX, grandTotalBoxHeight)
    .fill(GOLD);

  doc
    .fontSize(12.5)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("GRAND TOTAL", totalsLabelX + 14, totalsY + 11, {
      width: totalsLabelWidth - 14,
      align: "left",
    })
    .text(inr(order.totalAmount), totalsValueX, totalsY + 11, {
      width: totalsValueWidth - 10,
      align: "right",
    });

  // authorized signature
  const signatureTop = totalsY + grandTotalBoxHeight + 60;
  const signatureExists = fs.existsSync(SIGNATURE_PATH);

  if (signatureExists) {
    try {
      doc.image(SIGNATURE_PATH, PAGE_RIGHT - 160, signatureTop - 42, {
        width: 140,
      });
    } catch {
      /* fall through to the line-only signature block below */
    }
  }

  doc
    .moveTo(PAGE_RIGHT - 160, signatureTop)
    .lineTo(PAGE_RIGHT, signatureTop)
    .strokeColor(BORDER)
    .stroke();

  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor(DARK)
    .text(COMPANY_NAME, PAGE_RIGHT - 160, signatureTop + 8, {
      width: 160,
      align: "center",
    });

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(GRAY)
    .text("Authorized Signatory", PAGE_RIGHT - 160, signatureTop + 22, {
      width: 160,
      align: "center",
    });

  // footer
  const footerY = doc.page.height - 90;

  doc
    .moveTo(PAGE_LEFT, footerY)
    .lineTo(PAGE_RIGHT, footerY)
    .strokeColor(BORDER)
    .stroke();

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(GRAY)
    .text(
      `Thank you for shopping with ${COMPANY_NAME}! For any queries regarding this order, contact us at ${COMPANY_EMAIL} or ${COMPANY_PHONE}.`,
      PAGE_LEFT,
      footerY + 14,
      { width: PAGE_WIDTH, align: "center" }
    );

  doc
    .fontSize(8)
    .fillColor("#bbbbbb")
    .text(COMPANY_ADDRESS, PAGE_LEFT, footerY + 38, {
      width: PAGE_WIDTH,
      align: "center",
    });

  doc.end();
};
