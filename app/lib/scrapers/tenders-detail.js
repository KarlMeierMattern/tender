import puppeteer from "puppeteer";
import { ETENDERS_URL } from "@/app/lib/utils/constants";

export async function scrapeTendersDetail(options = {}) {
  // Default to 1 page (10 entries) if not specified
  const { maxPages = 1 } = options;

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 250,
  });

  try {
    const page = await browser.newPage();
    await page.goto(ETENDERS_URL, {
      waitUntil: "networkidle0",
      timeout: 120000,
    });

    const allTenders = [];
    let currentPage = 0;

    while (currentPage < maxPages) {
      await page.waitForSelector("table.display.dataTable", {
        timeout: 60000,
        visible: true,
      });

      // Get basic tender info for current page
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

      // Click each row and get details
      for (let index = 0; index < tenders.length; index++) {
        try {
          // Click to reveal details
          await page.evaluate((index) => {
            const buttonCell = document
              .querySelectorAll("table.display.dataTable tbody tr")
              [index].querySelector("td:nth-child(1)");
            if (buttonCell) buttonCell.click();
          }, index);

          // Wait for details to load
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Get details
          const details = await page.evaluate((index) => {
            const detailRow = document.querySelectorAll(
              "table.display.dataTable tbody tr"
            )[index].nextElementSibling;
            const nestedTable = detailRow?.querySelector("td table tbody");
            if (!nestedTable) return [];
            return Array.from(nestedTable.querySelectorAll("tr")).map((tr) =>
              Array.from(tr.querySelectorAll("td")).map((td) =>
                td.textContent.trim()
              )
            );
          }, index);

          // Process details
          const tenderDetails = {};
          details.forEach((detail) => {
            const [key, value] = detail;
            if (key && value) {
              const formattedKey = key
                .replace(/:\s*$/, "")
                .replace(/\s+/g, "")
                .toLowerCase();
              tenderDetails[formattedKey] = value;
            }
          });

          // Handle special key rename
          if (tenderDetails["placewheregoods,worksorservicesarerequired"]) {
            tenderDetails["placeServicesRequired"] =
              tenderDetails["placewheregoods,worksorservicesarerequired"];
            delete tenderDetails["placewheregoods,worksorservicesarerequired"];
          }

          // Create complete tender object
          const tender = {
            category: tenders[index].category,
            description: tenders[index].description,
            advertised: tenders[index].advertised,
            closing: tenders[index].closing,
            ...tenderDetails,
          };

          // Remove unwanted keys
          const keysToRemove = [
            "faxnumber",
            "isthereabriefingsession?",
            "isitcompulsory?",
            "briefingdateandtime",
            "briefingvenue",
            "contactperson",
            "email",
            "telephonenumber",
            "specialconditions",
            "datepublished",
            "closingdate",
          ];

          keysToRemove.forEach((key) => {
            delete tender[key];
          });

          allTenders.push(tender);
        } catch (error) {
          console.log(`Error processing tender at index ${index}:`, error);
          // Still add the basic tender info even if details failed
          allTenders.push(tenders[index]);
        }
      }

      // Add all tenders from the current page
      allTenders.push(...tenders);

      // Move to next page if not on last page
      currentPage++;
      if (currentPage < maxPages) {
        const nextButton = await page.$("a.paginate_button");
        if (nextButton) {
          await nextButton.click();
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          break; // No more pages available
        }
      }
    }

    return allTenders;
  } catch (error) {
    console.log("Scraping error", error);
    throw error;
  } finally {
    await browser.close();
  }
}
