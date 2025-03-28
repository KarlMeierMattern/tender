// Handles periodic updates to the db
// npm run db:update

import mongoose from "mongoose";
import { TenderModel } from "@/app/model/tenderModel.js";
import { scrapeTendersDetail } from "@/app/lib/scrapers/tenders-detail.js";
import { config } from "dotenv";

config();

async function updateTenders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Get new data from scraping
    const scrapedTenders = await scrapeTendersDetail();

    // 2. Format the scraped tenders
    const formattedTenders = scrapedTenders.map((tender) => ({
      category: tender.category,
      description: tender.description,
      advertised: new Date(tender.advertised),
      closing: tender.closing,
      tendernumber: tender.tendernumber,
      department: tender.department,
      tendertype: tender.tendertype,
      province: tender.province,
      placeServicesRequired: tender.placeServicesRequired,
    }));

    // 3. Get all existing tender numbers from DB
    const existingTenders = await TenderModel.find({}, "tendernumber");
    const existingTenderNumbers = new Set(
      existingTenders.map((t) => t.tendernumber)
    );

    // 4. Separate scraped tenders into new and existing
    const newTenders = [];
    const updatedTenders = [];
    const scrapedTenderNumbers = new Set();

    formattedTenders.forEach((tender) => {
      scrapedTenderNumbers.add(tender.tendernumber);

      if (!existingTenderNumbers.has(tender.tendernumber)) {
        // This is a new tender
        newTenders.push(tender);
      } else {
        // This tender exists and might need updating
        updatedTenders.push(tender);
      }
    });

    // 5. Find tenders that are no longer present in scraped data
    const tendersToRemove = [...existingTenderNumbers].filter(
      (number) => !scrapedTenderNumbers.has(number)
    );

    // 6. Perform database operations

    // Add new tenders
    if (newTenders.length > 0) {
      await TenderModel.insertMany(newTenders);
      console.log(`Added ${newTenders.length} new tenders`);
    }

    // Update existing tenders
    for (const tender of updatedTenders) {
      await TenderModel.findOneAndUpdate(
        { tendernumber: tender.tendernumber },
        tender,
        { new: true }
      );
    }
    console.log(`Updated ${updatedTenders.length} existing tenders`);

    // Remove old tenders
    if (tendersToRemove.length > 0) {
      await TenderModel.deleteMany({
        tendernumber: { $in: tendersToRemove },
      });
      console.log(`Removed ${tendersToRemove.length} old tenders`);
    }

    console.log("Database update completed successfully");
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Add logging for when the update runs
console.log("Starting tender database update:", new Date().toISOString());
updateTenders().catch((error) => {
  console.error("Update failed:", error);
  process.exit(1);
});
