import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(__dirname, "assets", "fonts", "Nirmala.ttc");
const outputPath = path.join(__dirname, "..", "test_output.pdf");

async function run() {
  console.log("Checking if font file exists:", fs.existsSync(fontPath));
  
  const doc = new PDFDocument({ size: "A4" });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Register font
  doc.registerFont("Nirmala", fontPath, "NirmalaUI");
  doc.registerFont("Nirmala-Bold", fontPath, "NirmalaUI-Bold");

  doc.font("Nirmala-Bold").fontSize(20).text("Kaumudi Saree Surat - Font Test");
  doc.moveDown();

  doc.font("Nirmala").fontSize(14);
  doc.text("English: Shivaji Chowk, Surat");
  doc.text("Hindi: हनुमान गली, इंदौर");
  doc.text("Gujarati: શિવાજી ચોક, સુરત");
  doc.text("Marathi: शिवाजी चौक, मुंबई");
  doc.text("Tamil: சென்னை");
  doc.text("Telugu: హైదరాబాద్");
  doc.text("Kannada: ಬೆಂಗಳೂರು");
  doc.text("Malayalam: തിരുവനന്തപുരം");
  doc.text("Punjabi: ਅੰਮ੍ਰਿਤਸਰ");
  doc.text("Rupee Symbol: ₹ 15,000");

  doc.moveDown();
  doc.font("Nirmala-Bold").text("Testing Bold Style:");
  doc.font("Nirmala-Bold").text("Hindi: हनुमान गली, इंदौर");
  doc.font("Nirmala-Bold").text("Gujarati: શિવાજી ચોક, સુરત");

  doc.end();

  stream.on("finish", () => {
    console.log("PDF generated successfully at:", outputPath);
  });
}

run().catch(console.error);
