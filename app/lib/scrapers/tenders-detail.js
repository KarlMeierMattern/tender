import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTendersDetail() {
  const browser = await puppeteer.launch({
    headless: true,
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

    while (hasNextPage && allTenders.length < 20) {
      // specifies the number of entries to scrape
      // Wait for the table to load
      await page.waitForSelector("table.display.dataTable");

      // Scrape the current page's tenders
      const tenders = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.display.dataTable tbody tr")
        );
        return rows.map((row) => ({
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
      // iterates over each object in the tenders array
      for (const row of tenders) {
        if (clickCount >= 10) break; // specifies the number of detailed entries to scrape

        const rows = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll("table.display.dataTable tbody tr")
          ).map((tr) => tr.innerHTML); // maps over each row (tr) in the array and retrieves the innerHTML of each row
        });

        // .entries extracts key, value pairs
        for (const [index, rowHTML] of rows.entries()) {
          const description = await page.evaluate((index) => {
            const row = document.querySelectorAll(
              "table.display.dataTable tbody tr" // retrieves the row at the position specified by index
            )[index]; // uses index to select the specific row from the NodeList returned by document.querySelectorAll()
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

            // Flatten the details into the tender object
            const tenderDetails = {};
            details.forEach((detail) => {
              const [key, value] = detail; // Assuming each detail is an array of [key, value]
              if (key && value) {
                // Convert keys to camelCase or any desired format
                const formattedKey = key.replace(/\s+/g, "").toLowerCase(); // Example: "Tender Number" -> "tenderNumber"
                tenderDetails[formattedKey] = value;
              }
            });

            // Merge the details into the tender object
            const tender = {
              category: row.category,
              description: row.description,
              advertised: row.advertised,
              closing: row.closing,
              ...tenderDetails, // Spread the flattened details into the tender object
            };

            // Remove unwanted keys
            const keysToRemove = [
              "faxnumber:",
              "isthereabriefingsession?:",
              "isitcompulsory?",
              "briefingdateandtime:",
              "briefingvenue:",
            ];

            keysToRemove.forEach((key) => {
              delete tender[key]; // Remove the key from the tender object
            });

            // Add the tender to the allTenders array
            allTenders.push(tender);
            // row.details = details;
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
    return allTenders;
  } catch (error) {
    console.log("Scraping error", error);
    throw error;
  } finally {
    await browser.close();
  }
}
