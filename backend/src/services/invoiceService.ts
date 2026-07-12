import PDFDocument from "pdfkit";
import { Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLD = "#b8860b";
const GOLD_DARK = "#9c7419";
const DARK = "#222222";
const GRAY = "#888888";
const LIGHT_BG = "#fff8e7";
const BORDER = "#eeeeee";
const PAGE_LEFT = 50;
const PAGE_RIGHT = 545;
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;

const SIGNATURE_PATH = path.join(__dirname, "..", "assets", "signature.png");
const NIRMALA_FONT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "fonts",
  "Nirmala.ttc"
);

const COMPANY_NAME = "Kaumudi Sarees";
const COMPANY_ADDRESS = "Kaumudi Sarees, Ring Road, Surat, Gujarat - 395002";
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

const inr = (amount: number) =>
  `₹ ${Math.round(amount).toLocaleString("en-IN")}`;

/**
 * Draws the original invoice design on the given PDFKit document
 */
const drawOriginalInvoice = (doc: PDFKit.PDFDocument, order: InvoiceOrder) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();

  const hasNirmala = fs.existsSync(NIRMALA_FONT_PATH);
  if (hasNirmala) {
    doc.registerFont("Nirmala", NIRMALA_FONT_PATH, "NirmalaUI");
    doc.registerFont("Nirmala-Bold", NIRMALA_FONT_PATH, "NirmalaUI-Bold");
  }
  const fontRegular = hasNirmala ? "Nirmala" : "Helvetica";
  const fontBold = hasNirmala ? "Nirmala-Bold" : "Helvetica-Bold";

  // header band
  const headerHeight = 110;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(GOLD);

  const LOGO_PATH = path.join(__dirname, "..", "assets", "kaumodi.png");
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, PAGE_LEFT, 30, { height: 50 });
  }

  doc
    .fillColor("#ffffff")
    .fontSize(28)
    .font(fontBold)
    .text("KAUMUDI", PAGE_LEFT + 130, 42);

  doc
    .fontSize(20)
    .font(fontBold)
    .fillColor("#ffffff")
    .text("INVOICE", 0, 40, { align: "right", width: PAGE_RIGHT });

  // meta row — invoice #, date, status
  const metaTop = headerHeight + 30;

  const metaCol = (
    x: number,
    label: string,
    value: string,
    valueColor = DARK,
    useBold = false
  ) => {
    doc
      .fontSize(9)
      .font(fontBold)
      .fillColor(GRAY)
      .text(label, x, metaTop, { characterSpacing: 0.5 })
      .fontSize(13)
      .font(useBold ? fontBold : fontRegular)
      .fillColor(valueColor)
      .text(value, x, metaTop + 14);
  };

  metaCol(PAGE_LEFT, "INVOICE NUMBER", `#${orderId}`, DARK, true);
  metaCol(
    220,
    "ORDER DATE",
    new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  metaCol(
    400,
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
  const addr = order.shippingAddress || {
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    mobileNumber: ""
  };

  doc
    .fontSize(10)
    .font(fontBold)
    .fillColor(GRAY)
    .text("BILLED TO", PAGE_LEFT, addrTop);

  doc
    .fontSize(11)
    .font(fontBold)
    .fillColor(DARK)
    .text(order.user?.name || addr.fullName, PAGE_LEFT, addrTop + 16);

  doc
    .fontSize(10)
    .font(fontRegular)
    .fillColor(GRAY)
    .text(order.user?.email || "", PAGE_LEFT, addrTop + 32);

  const shipX = 320;
  doc
    .fontSize(10)
    .font(fontBold)
    .fillColor(GRAY)
    .text("SHIPPING ADDRESS", shipX, addrTop);

  const addressLines = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2 || "",
    `${addr.city}, ${addr.state} - ${addr.postalCode}`,
    addr.country,
    `Phone: ${addr.mobileNumber}`,
  ].filter(line => line && line.trim() !== "");

  const addressText = addressLines.join("\n");

  doc
    .fontSize(10)
    .font(fontRegular)
    .fillColor(DARK)
    .text(addressText, shipX, addrTop + 16, {
      width: PAGE_RIGHT - shipX,
      lineGap: 3,
    });

  const addressHeight = doc.heightOfString(addressText, {
    width: PAGE_RIGHT - shipX,
    lineGap: 3,
  });

  // items table starts dynamically based on address block height
  let tableTop = Math.max(addrTop + 120, addrTop + 16 + addressHeight + 25);

  doc.rect(PAGE_LEFT, tableTop, PAGE_WIDTH, 26).fill(LIGHT_BG);
  doc
    .fontSize(10)
    .font(fontBold)
    .fillColor(GOLD_DARK)
    .text("ITEM", PAGE_LEFT + 10, tableTop + 8)
    .text("QTY", 330, tableTop + 8, { width: 50, align: "center" })
    .text("PRICE", 390, tableTop + 8, { width: 70, align: "right" })
    .text("TOTAL", 470, tableTop + 8, { width: 65, align: "right" });

  let rowY = tableTop + 26;

  order.items.forEach((item, idx) => {
    const name =
      (typeof item.product === "object" && item.product?.name) ||
      "Saree Product";
    const lineTotal = item.price * item.quantity;

    const nameHeight = doc.heightOfString(name, { width: 260 });
    const rowHeight = Math.max(26, nameHeight + 14);

    // Auto page wrap
    if (rowY + rowHeight > 730) {
      doc.addPage({ size: "A4", margin: 0 });
      
      const pageHeaderY = 40;
      doc
        .fontSize(8)
        .fillColor(GRAY)
        .font(fontBold)
        .text(`INVOICE: #${orderId}`, PAGE_LEFT, pageHeaderY)
        .text(`Page ${doc.bufferedPageRange().count}`, 0, pageHeaderY, { align: "right", width: PAGE_RIGHT });
      
      doc
        .moveTo(PAGE_LEFT, pageHeaderY + 14)
        .lineTo(PAGE_RIGHT, pageHeaderY + 14)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      tableTop = pageHeaderY + 25;
      doc.rect(PAGE_LEFT, tableTop, PAGE_WIDTH, 26).fill(LIGHT_BG);
      doc
        .fontSize(10)
        .font(fontBold)
        .fillColor(GOLD_DARK)
        .text("ITEM", PAGE_LEFT + 10, tableTop + 8)
        .text("QTY", 330, tableTop + 8, { width: 50, align: "center" })
        .text("PRICE", 390, tableTop + 8, { width: 70, align: "right" })
        .text("TOTAL", 470, tableTop + 8, { width: 65, align: "right" });

      rowY = tableTop + 26;
    }

    if (idx % 2 === 1) {
      doc.rect(PAGE_LEFT, rowY, PAGE_WIDTH, rowHeight).fill("#fafafa");
    }

    doc
      .fontSize(10)
      .font(fontRegular)
      .fillColor(DARK)
      .text(name, PAGE_LEFT + 10, rowY + 7, { width: 260 })
      .text(String(item.quantity), 330, rowY + 7, {
        width: 50,
        align: "center",
      })
      .text(inr(item.price), 390, rowY + 7, { width: 70, align: "right" })
      .text(inr(lineTotal), 470, rowY + 7, { width: 65, align: "right" });

    rowY += rowHeight;
  });

  doc
    .moveTo(PAGE_LEFT, rowY + 5)
    .lineTo(PAGE_RIGHT, rowY + 5)
    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();

  // Totals calculations
  let subtotal = 0;
  order.items.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  const discount = order.discountAmount || 0;
  const shipping = Math.max(0, order.totalAmount + discount - subtotal);
  const tax = 0;

  // Add page if totals section doesn't fit
  if (rowY + 140 > 730) {
    doc.addPage({ size: "A4", margin: 0 });

    const pageHeaderY = 40;
    doc
      .fontSize(8)
      .fillColor(GRAY)
      .font(fontBold)
      .text(`INVOICE: #${orderId}`, PAGE_LEFT, pageHeaderY)
      .text(`Page ${doc.bufferedPageRange().count}`, 0, pageHeaderY, { align: "right", width: PAGE_RIGHT });

    doc
      .moveTo(PAGE_LEFT, pageHeaderY + 14)
      .lineTo(PAGE_RIGHT, pageHeaderY + 14)
      .strokeColor(BORDER)
      .lineWidth(1)
      .stroke();

    rowY = pageHeaderY + 25;
  }

  let totalsY = rowY + 20;
  const totalsLabelX = 330;
  const totalsLabelWidth = 130;
  const totalsValueX = 470;
  const totalsValueWidth = 75;

  const totalsRow = (label: string, value: string) => {
    doc
      .fontSize(10)
      .font(fontRegular)
      .fillColor(GRAY)
      .text(label, totalsLabelX, totalsY, {
        width: totalsLabelWidth,
        align: "right",
      })
      .fillColor(DARK)
      .text(value, totalsValueX, totalsY, {
        width: totalsValueWidth,
        align: "right",
      });
    totalsY += 18;
  };

  totalsRow("Subtotal", inr(subtotal));

  if (discount > 0) {
    const discountLabel = order.couponCode ? `Discount (${order.couponCode})` : "Discount";
    totalsRow(discountLabel, `- ${inr(discount)}`);
  }

  totalsRow("Shipping", shipping > 0 ? inr(shipping) : "Free");
  totalsRow("Tax", inr(tax));
  totalsRow(
    "Payment Method",
    order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"
  );

  totalsY += 6;

  // Grand Total Box
  doc.rect(320, totalsY - 6, 225, 32).fill(GOLD);
  doc
    .fontSize(12)
    .font(fontBold)
    .fillColor("#ffffff")
    .text("GRAND TOTAL", 330, totalsY + 3, {
      width: totalsLabelWidth,
      align: "right",
    })
    .text(inr(order.totalAmount), totalsValueX, totalsY + 3, {
      width: totalsValueWidth,
      align: "right",
    });

  totalsY += 32;

  // Authorized signature
  let signatureTop = totalsY + 40;

  if (signatureTop + 40 > 730) {
    doc.addPage({ size: "A4", margin: 0 });

    const pageHeaderY = 40;
    doc
      .fontSize(8)
      .fillColor(GRAY)
      .font(fontBold)
      .text(`INVOICE: #${orderId}`, PAGE_LEFT, pageHeaderY)
      .text(`Page ${doc.bufferedPageRange().count}`, 0, pageHeaderY, { align: "right", width: PAGE_RIGHT });

    doc
      .moveTo(PAGE_LEFT, pageHeaderY + 14)
      .lineTo(PAGE_RIGHT, pageHeaderY + 14)
      .strokeColor(BORDER)
      .lineWidth(1)
      .stroke();

    signatureTop = pageHeaderY + 50;
  }

  const signatureExists = fs.existsSync(SIGNATURE_PATH);
  if (signatureExists) {
    try {
      doc.image(SIGNATURE_PATH, PAGE_RIGHT - 160, signatureTop - 42, {
        width: 140,
      });
    } catch {
      /* fall through */
    }
  }

  doc
    .moveTo(PAGE_RIGHT - 160, signatureTop)
    .lineTo(PAGE_RIGHT, signatureTop)
    .strokeColor(BORDER)
    .stroke();

  doc
    .fontSize(10)
    .font(fontBold)
    .fillColor(DARK)
    .text(COMPANY_NAME, PAGE_RIGHT - 160, signatureTop + 8, {
      width: 160,
      align: "center",
    });

  doc
    .fontSize(8)
    .font(fontRegular)
    .fillColor(GRAY)
    .text("Authorized Signatory", PAGE_RIGHT - 160, signatureTop + 22, {
      width: 160,
      align: "center",
    });

  // Render footers dynamically on all pages at the end
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 90;

    doc
      .moveTo(PAGE_LEFT, footerY)
      .lineTo(PAGE_RIGHT, footerY)
      .strokeColor(BORDER)
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(9)
      .font(fontRegular)
      .fillColor(GRAY)
      .text(
        `Thank you for shopping with ${COMPANY_NAME}! For any queries regarding this order, contact us at ${COMPANY_EMAIL} or ${COMPANY_PHONE}.`,
        PAGE_LEFT,
        footerY + 14,
        { width: PAGE_WIDTH, align: "center" }
      );

    doc
      .fontSize(8)
      .font(fontRegular)
      .fillColor("#bbbbbb")
      .text(COMPANY_ADDRESS, PAGE_LEFT, footerY + 38, {
        width: PAGE_WIDTH,
        align: "center",
      });
  }
};

/**
 * Generates the original visual invoice design as a memory buffer
 */
export const generateInvoicePDFBuffer = async (order: InvoiceOrder): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      drawOriginalInvoice(doc, order);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Streams the original visual invoice design directly to Express Response
 */
export const generateInvoicePDF = async (order: InvoiceOrder, res: Response) => {
  try {
    const orderId = order._id.toString().slice(-8).toUpperCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Kaumudi-Invoice-${orderId}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    doc.pipe(res);

    drawOriginalInvoice(doc, order);
    doc.end();
  } catch (error: any) {
    console.error("Error generating invoice stream:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate invoice PDF",
        error: error.message,
      });
    }
  }
};
