import { generateInvoicePDFBuffer } from "./services/invoiceService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockOrder = {
  _id: "6a534e9674e07cee5c238faf",
  items: [
    {
      product: { name: "बनारसी सिल्क साड़ी - Premium Luxury Handcrafted Banarasi Saree With Gold Zari Borders", sku: "SUH-BAN-001" },
      quantity: 1,
      price: 18500
    },
    {
      product: { name: "શિવાજી સિલ્ક સાડી - Elegant Designer Saree from Surat", sku: "SUH-GUJ-002" },
      quantity: 2,
      price: 4200
    }
  ],
  totalItems: 3,
  totalAmount: 26800,
  discountAmount: 1000,
  couponCode: "WELCOME1000",
  paymentMethod: "COD",
  paymentStatus: "pending",
  orderStatus: "confirmed",
  createdAt: new Date(),
  shippingAddress: {
    fullName: "શિવાજી ચોક (Surat Customer)",
    mobileNumber: "08959465264",
    addressLine1: "हनुमान गली, फ्लैट नंबर ४०२",
    addressLine2: "શિવાજી ચોક, સુરત, ગુજરાત - ૩૯૫૦૦૨",
    city: "Surat",
    state: "Gujarat",
    postalCode: "456550",
    country: "India"
  },
  user: { name: "Gopal Makwana", email: "g91652251@gmail.com" }
};

async function test() {
  console.log("Generating invoice buffer...");
  const buffer = await generateInvoicePDFBuffer(mockOrder as any);
  
  const outputPath = path.join(__dirname, "..", "test_invoice_output.pdf");
  fs.writeFileSync(outputPath, buffer);
  console.log("Saved PDF invoice to:", outputPath);
}

test().catch(console.error);
