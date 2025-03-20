import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTendersDetail() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
  });

  try {
    const page = await browser.newPage();
    await page.goto(ETENDERS_URL, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const allTenders = [];
    let hasNextPage = true;

    while (hasNextPage && allTenders.length <= 5) {
      // Wait for the table to load
      await page.waitForSelector("table.display.dataTable");

      // Scrape the current page's tenders
      const tenders = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.display.dataTable tbody tr")
        );
        return rows.map((row) => ({
          button:
            row.querySelector("td:nth-child(1)")?.textContent?.trim() || "",
          category:
            row.querySelector("td:nth-child(2)")?.textContent?.trim() || "",
          description:
            row.querySelector("td:nth-child(3)")?.textContent?.trim() || "",
          advertised:
            row.querySelector("td:nth-child(5)")?.textContent?.trim() || "",
          closing:
            row.querySelector("td:nth-child(6)")?.textContent?.trim() || "",
        }));
      });

      // Click on each row to reveal details
      let clickCount = 0;
      for (const row of tenders) {
        if (clickCount >= 2) break; // Stop after clicking on two rows

        const rows = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll("table.display.dataTable tbody tr")
          ).map((tr) => tr.innerHTML);
        });

        for (const [index, rowHTML] of rows.entries()) {
          const description = await page.evaluate((index) => {
            const row = document.querySelectorAll(
              "table.display.dataTable tbody tr"
            )[index];
            return row.querySelector("td.sorting_1")?.textContent.trim();
          }, index);

          if (description === row.description) {
            console.log(`Clicking row with description: ${row.description}`);
            await page.evaluate((index) => {
              const buttonCell = document
                .querySelectorAll("table.display.dataTable tbody tr")
                [index].querySelector("td:nth-child(1)");
              buttonCell?.click();
            }, index);

            console.log(`Clicked row: ${row.description}`);
            await page.waitForFunction(
              (index) => {
                const row = document.querySelectorAll(
                  "table.display.dataTable tbody tr"
                )[index];
                return row.classList.contains("shown");
              },
              { timeout: 30000 },
              index
            );

            const details = await page.evaluate((index) => {
              const detailRow = document.querySelectorAll(
                "table.display.dataTable tbody tr"
              )[index].nextElementSibling;
              const nestedTable = detailRow.querySelector("td table tbody");
              if (!nestedTable) return [];
              return Array.from(nestedTable.querySelectorAll("tr")).map((tr) =>
                Array.from(tr.querySelectorAll("td")).map((td) =>
                  td.textContent.trim()
                )
              );
            }, index);

            row.details = details;
            clickCount++; // Increment the counter
            break; // Exit the inner loop once clicked
          }
        }
      }

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
