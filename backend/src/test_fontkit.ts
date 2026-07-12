import fontkit from "fontkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(__dirname, "assets", "fonts", "Nirmala.ttc");

try {
  const collection = fontkit.openSync(fontPath);
  console.log("Is collection:", collection.fonts ? "Yes" : "No");
  if (collection.fonts) {
    console.log("Number of fonts:", collection.fonts.length);
    collection.fonts.forEach((font: any, idx: number) => {
      console.log(`Font ${idx}:`);
      console.log("  postscriptName:", font.postscriptName);
      console.log("  fullName:", font.fullName);
      console.log("  familyName:", font.familyName);
      console.log("  subfamilyName:", font.subfamilyName);
    });
  }
} catch (err) {
  console.error("Error reading font with fontkit:", err);
}
