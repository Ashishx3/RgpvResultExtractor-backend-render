
import express from "express";
import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";

const router = express.Router();

router.post("/result", async (req, res) => {
  try {
    const { enrollmentNo, branch, semester } = req.body;

    // Launch browser
    const browser = await puppeteer.launch({ headless: false,slowMo:70, });
    const page = await browser.newPage();

    // Open the main page
    await page.goto("https://result.rgpv.ac.in/Result/ProgramSelect.aspx", {
      waitUntil: "networkidle2",
    });

    // Click on B.Tech radio button
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("#radlstProgram_1"),
    ]);

    // Fill form
    await page.type("#ctl00_ContentPlaceHolder1_txtrollno", enrollmentNo);
    await page.select("#ctl00_ContentPlaceHolder1_drpSemester", semester);

    // Capture captcha image
    const captchaEl = await page.$('img[src*="Captcha"]');
    if (!captchaEl) throw new Error("Captcha image not found!");

    const captchaBuffer = await captchaEl.screenshot({ encoding: "base64" });

    // OCR using Tesseract
    const { data } = await Tesseract.recognize(
      `data:image/png;base64,${captchaBuffer}`,
      "eng"
    );

    const captchaText = data.text.trim().replace(/\s+/g, "");
    console.log("🔍 Captcha:", captchaText);

    // Type captcha and submit form

    await page.type("#ctl00_ContentPlaceHolder1_TextBox1", captchaText);
   await page.click('#ctl00_ContentPlaceHolder1_btnviewresult');

//  Wait until the result panel actually contains text

await page.waitForFunction(() => {
  const el = document.querySelector('#ctl00_ContentPlaceHolder1_pnlGrading');
  return el && el.innerText.trim().length > 0;
}, { timeout: 90000 }).catch(() => console.log("⚠️ Result panel not found — maybe captcha failed or slow load"));


    const html = await page.content();

    await browser.close();

    res.json({
      success: true,
      captchaText,
      resultHTML: html,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


