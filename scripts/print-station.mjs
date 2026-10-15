import { createInterface } from "node:readline/promises";
import { createCups } from "./station/cups.mjs";
import { printAtStation, stationClient } from "./station/client.mjs";

const cups = createCups();
try {
  if (!["darwin", "linux"].includes(process.platform)) throw new Error("This adapter supports macOS/Linux CUPS only. Windows needs a separately validated adapter; browser fallback is disabled in managed mode.");
  const printer = process.env.ZDROP_PRINTER;
  if (process.argv[2] === "--check") {
    await cups.inspect(printer);
    console.log("Configured queue found. Physical output, copies, color, duplex and retention still require acceptance testing.");
  } else if (process.argv[2] === "--cancel") {
    await cups.cancel(printer, process.argv[3]);
    console.log("Queue cancellation requested. Already printed pages cannot be recalled.");
  } else {
    if (process.argv.length > 2) throw new Error("Use no arguments to enter a code, --check, or --cancel QUEUE-JOBID.");
    const call = stationClient(process.env.ZDROP_STATION_URL || "http://localhost:3000", process.env.ZDROP_STATION_KEY);
    console.log("One-time job: submission, cancellation or preparation failure ends access and deletes ZDrop's stored files. No automatic print retry.");
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const code = (await prompt.question("ZDrop six-digit job code: ")).trim();
    prompt.close();
    const controller = new AbortController();
    process.once("SIGINT", () => controller.abort());
    const result = await printAtStation({ code, printer, cups, call, signal: controller.signal, progress: message => console.log(message) });
    console.log(`${result.outcome === "SPOOLED" ? "Submitted to queue" : "Cancellation requested"}: ${result.queueId}. ZDrop's stored copy was deleted. Paper output is not verified.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
