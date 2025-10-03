const express = require("express");
const PuppeteerHTMLPDF = require("puppeteer-html-pdf");
const handlebars = require("handlebars");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const htmlPDF = new PuppeteerHTMLPDF();
htmlPDF.setOptions({ format: "A4" });

app.post("/generate-pdf", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Received Data:", data);   // ✅ LOG

    if (data.Age_Months <= 3) {
      let milkLiters = (data.Weight_Kg / 5).toFixed(2);
      data.Milk = `${milkLiters} liter/day (Maa ka doodh ya replacement milk)`;
    } else {
      data.Milk = null;
    }

    const html = fs.readFileSync("template.html", "utf8");
    const template = handlebars.compile(html);
    const result = template(data);

    const pdfBuffer = await htmlPDF.create(result);

    console.log("✅ PDF Generated with Milk:", data.Milk); // ✅ LOG

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).send("Internal Server Error");
  }
});
// ---------- Feeding Plan API (for frontend display) ----------
app.post("/feeding-plan", (req, res) => {
  const data = req.body;

  // Milk calculation
  if (data.Age_Months <= 3) {
    let milkLiters = (data.Weight_Kg / 5).toFixed(2);
    data.Milk = `${milkLiters} liter/day (Maa ka doodh ya replacement milk)`;
  } else {
    data.Milk = "Not required (age > 3 months)";
  }

  // Water (2% body weight)
  data.Water = (data.Weight_Kg * 0.02).toFixed(1) + " liter/day (Pani)";

  // Fodder only for older goats
  if (data.Age_Months > 1) {
    data.GreenFodder = "200 g/day (Berseem, Lucerne, Jowar, Bajra)";
    data.DryFodder = "100 g/day (Bhusa, Parali)";
    data.TotalMix = "50 g/day (Khal/Chokar Dana)";
  }

  res.json(data);
});



app.listen(4000, () => {
  console.log("🚀 Server running at http://localhost:4000");
});
