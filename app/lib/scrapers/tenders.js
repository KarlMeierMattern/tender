import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTenders() {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  try {
    const page = await browser.newPage();
    await page.goto(ETENDERS_URL, {
      waitUntil: "networkidle0",
    });

    const allTenders = [];
    let hasNextPage = true;

    while (hasNextPage && allTenders.length < 50) {
      // Wait for the table to load
      await page.waitForSelector("table.display.dataTable");

      // Scrape the current page's tenders
      const tenders = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.display.dataTable tbody tr")
        );
        return rows.map((row) => {
          return {
            category:
              row.querySelector("td.break-word")?.textContent?.trim() || "",
            description:
              row.querySelector("td.sorting_1")?.textContent?.trim() || "",
            eSubmission:
              row
                .querySelector("td.submission-notAllowed")
                ?.textContent?.trim() || "",
            advertised:
              row.querySelector("td.text-center")?.textContent?.trim() || "",
            closing:
              row.querySelector("td:nth-child(5)")?.textContent?.trim() || "",
          };
        });
      });

      allTenders.push(...tenders); // Add the current page's tenders to the allTenders array

      // Check if there's a next page
      const nextButton = await page.$("a.paginate_button"); // Adjust the selector based on the actual pagination button
      if (nextButton) {
        await nextButton.click(); // Click the "Next" button
      } else {
        hasNextPage = false; // No more pages
      }
    }

    // Limit the results to 50
    return allTenders.slice(0, 50);
  } catch (error) {
    console.log("Scraping error", error);
    throw error;
  } finally {
    await browser.close();
  }
}
