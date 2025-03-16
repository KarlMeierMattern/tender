import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTenders() {
  const browser = await puppeteer.launch({
    headless: false, // Disable headless mode
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

    while (hasNextPage && allTenders.length <= 1) {
      // Wait for the table to load
      await page.waitForSelector("table.display.dataTable");

      // Scrape the current page's tenders
      const tenders = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.display.dataTable tbody tr")
        );
        return rows.map((row) => {
          return {
            button:
              row.querySelector("td:nth-child(1)")?.textContent?.trim() || "",
            category:
              row.querySelector("td:nth-child(2)")?.textContent?.trim() || "",
            description:
              row.querySelector("td:nth-child(3)")?.textContent?.trim() || "",
            advertised:
              row.querySelector("td:nth-child(5)")?.textContent?.trim() || "",
            closing:
              row.querySelector("td:nth-child(6")?.textContent?.trim() || "",
          };
        });
      });

      // Click on each row to reveal details
      for (const row of tenders) {
        const rows = await page.$$("table.display.dataTable tbody tr"); // Get all rows
        for (const tableRow of rows) {
          const description = await tableRow.$eval("td.sorting_1", (el) =>
            el.textContent.trim()
          );
          if (description === row.description) {
            console.log(`Clicking row with description: ${row.description}`);
            const buttonCell = await tableRow.$("td:nth-child(1)"); // Select the clickable cell
            if (buttonCell) {
              await buttonCell.click();
            } else {
              console.log(
                `Clickable element not found for row: ${row.description}`
              );
            }
            console.log(`Clicked row: ${row.description}`);
            await page.waitForFunction(
              (el) => el.classList.contains("shown"),
              { timeout: 30000 },
              tableRow // Puppeteer injects tableRow into the browser context tableRow.classList.contains("shown")
            );

            // Now get the next row (expanded details row)
            const detailRowHandle = await page.evaluateHandle(
              (el) => el.nextElementSibling,
              tableRow
            );

            if (detailRowHandle) {
              // Extract details from the nested table inside this row
              const details = await page.evaluate((detailRow) => {
                const nestedTable = detailRow.querySelector("td table tbody");
                if (!nestedTable) return [];
                return Array.from(nestedTable.querySelectorAll("tr")).map(
                  (tr) =>
                    Array.from(tr.querySelectorAll("td")).map((td) =>
                      td.textContent.trim()
                    )
                );
              }, detailRowHandle);

              row.details = details;
            }
            break; // Exit the inner loop once clicked
          }
        }
      }

      allTenders.push(...tenders); // Add the current page's tenders to the allTenders array

      // Check if there's a next page
      const nextButton = await page.$("a.paginate_button"); // Adjust the selector based on the actual pagination button
      if (nextButton) {
        await nextButton.click(); // Click the "Next" button
        await page.waitForTimeout(1000); // Wait for 1 second to allow the next page to load
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
