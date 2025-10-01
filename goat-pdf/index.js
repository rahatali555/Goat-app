const express = require("express");
const PuppeteerHTMLPDF = require("puppeteer-html-pdf");
const hbs = require("handlebars");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

// ---------- Initialize App ----------
const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(bodyParser.json());

// ---------- Puppeteer HTML to PDF Setup ----------
const htmlPDF = new PuppeteerHTMLPDF();
htmlPDF.setOptions({ format: "A4" });

// ---------- PDF Generation Endpoint ----------
app.post("/generate-pdf", async (req, res) => {
  try {
    const pdfData = req.body;
    console.log("📦 PDF DATA RECEIVED:", pdfData);

    // Read and compile the Handlebars template
    const html = fs.readFileSync(__dirname + "/template.html", "utf8");
    const template = hbs.compile(html);
    const content = template(pdfData);

    // Generate PDF buffer
    const pdfBuffer = await htmlPDF.create(content);

    // Send PDF as response
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

// ---------- Start Server ----------
app.listen(4000, () => {
  console.log("🚀 Server running at http://localhost:4000");
});
