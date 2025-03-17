import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTendersTest() {
  const browser = await puppeteer.launch({
    headless: "false",
    slowMo: 100,
  });

  try {
    const page = await browser.newPage();
    await page.goto(ETENDERS_URL, {
      waitUntil: "networkidle0",
    });

    const allElements = await page.evaluate(() => {
      const elements = Array.from(document.body.getElementsByTagName("*"));
      return elements.map((element) => ({
        tagName: element.tagName,
        textContent: element.textContent.trim(),
        classList: Array.from(element.classList),
        id: element.id,
      }));
    });

    return allElements;
  } catch (error) {
    console.log("Scraping error", error);
    throw error;
  } finally {
    await browser.close();
  }
}
