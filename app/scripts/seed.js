// Handles initial db seeding
// To seed database run:
// npm run db:seed

import mongoose from "mongoose";
import { TenderModel } from "@/app/model/tenderModel.js";
import { scrapeTendersDetail } from "@/app/lib/scrapers/tenders-detail.js";
import dotenv from "dotenv";
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
    const tenders = await scrapeTendersDetail();

    // Format the data to match your schema
    const formattedTenders = tenders.map((tender) => ({
      category: tender.category,
      description: tender.description,
      advertised: new Date(tender.advertised), // Convert to Date since your schema expects a Date type
      closing: tender.closing,
      tendernumber: tender.tendernumber,
      department: tender.department,
      tendertype: tender.tendertype,
      province: tender.province,
      placeServicesRequired: tender.placeServicesRequired,
    }));

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
