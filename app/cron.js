// automatically runs the update process at specified intervals
// sets up schedules and calls the update function

import cron from "node-cron";
import { updateTenders } from "./scripts/updateTenders";

// Run weekly (Every Monday at 1:00 AM)
cron.schedule("0 1 * * 1", async () => {
  console.log("Running weekly tender update:", new Date().toISOString());
  try {
    await updateTenders();
    console.log("Weekly update completed successfully");
  } catch (error) {
    console.error("Weekly update failed:", error);
  }
});
