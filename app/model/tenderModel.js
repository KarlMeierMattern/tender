import mongoose from "mongoose";

export const TenderModel = mongoose.model(
  "Tender",
  new mongoose.Schema(
    {
      category: {
        type: String,
      },
      description: {
        type: String,
      },
      advertised: {
        type: Date,
      },
      closing: {
        type: String,
      },
      tendernumber: {
        type: String,
      },
      department: {
        type: String,
      },
      tendertype: {
        type: String,
      },
      province: {
        type: String,
      },
      placeServicesRequired: {
        type: String,
      },
    },
    { timestamps: true }
  )
);
