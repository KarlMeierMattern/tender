// Handles initial db seeding
// To seed database run:
// npm run db:seed

import mongoose from "mongoose";
import { TenderModel } from "../model/tenderModel.js";
import { scrapeTendersDetail } from "../lib/scrapers/tenders-detail.js";
import dotenv from "dotenv";
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

async function main() {
  await connectDB();

  try {
    // Clear existing data
    await TenderModel.deleteMany({});
    console.log("Cleared existing tenders");

    // Scrape tender data
    const tenders = await scrapeTendersDetail({ maxPages: Infinity });
    console.log("Starting full data scrape...");

    // Format the data to match your schema
    const formattedTenders = tenders.map((tender) => {
      // Convert DD/MM/YYYY to mongo db recognised format of YYYY-MM-DD
      const [day, month, year] = tender.advertised.split("/");
      const formattedDate = `${year}-${month}-${day}`;

      return {
        category: tender.category,
        description: tender.description,
        advertised: new Date(formattedDate), // Convert to Date object
        closing: tender.closing,
        tendernumber: tender.tendernumber,
        department: tender.department,
        tendertype: tender.tendertype,
        province: tender.province,
        placeServicesRequired: tender.placeServicesRequired,
      };
    });

    // Insert the tenders
    const result = await TenderModel.insertMany(formattedTenders);
    console.log(`Successfully seeded ${result.length} tenders`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
