import { closeDb } from "@/db/client";
import { runDailyRefresh } from "@/lib/ingestion/daily-refresh";

try {
  const result = await runDailyRefresh();
  console.log(JSON.stringify(result, null, 2));
  if (result.fetched === 0) {
    console.log("No source was due. Refreshes only fetch sources with display approval, enabled state, and explicit automated-fetch permission.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
