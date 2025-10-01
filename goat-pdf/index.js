const express = require("express");
const PuppeteerHTMLPDF = require("puppeteer-html-pdf");
const hbs = require("handlebars");
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
    const pdfData = req.body;
      console.log("📦 PDF DATA RECEIVED:", pdfData); // <-- good place for debug log
     // Ensure template file exists at this location
      const html = fs.readFileSync(__dirname + "/template.html", "utf8");
    const template = hbs.compile(html);
    const content = template(pdfData);

    const pdfBuffer = await htmlPDF.create(content);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=feeding-plan.pdf",
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).send("Error generating PDF");
  }
});

app.listen(4000, () => console.log("🚀 Server running at http://localhost:4000"));
