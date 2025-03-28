import cron from "node-cron";
import { updateTenders } from "./scripts/updateTenders";

// Run weekly
cron.schedule("0 1 * * 1", () => {
  console.log("Running weekly tender update");
  updateTenders();
});

// Or monthly
cron.schedule("0 1 1 * *", () => {
  console.log("Running monthly tender update");
  updateTenders();
});
