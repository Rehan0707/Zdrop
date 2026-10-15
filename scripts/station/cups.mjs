import { spawn } from "node:child_process";

const printerPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,126}$/;
export function validatePrinter(printer) {
  if (!printerPattern.test(printer || "")) throw new Error("Set ZDROP_PRINTER to one administrator-approved CUPS queue name.");
  return printer;
}

/** No shell, filenames, document titles, or document bytes in arguments/logs. */
export function command(binary, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, LC_ALL: "C", LANG: "C" } });
    let output = "";
    const timer = setTimeout(() => { child.kill("SIGTERM"); reject(new Error("Printer command timed out. Submission may be uncertain; do not automatically retry.")); }, 20_000);
    child.on("error", () => { clearTimeout(timer); reject(new Error("CUPS tools are unavailable on this station.")); });
    child.stdout.on("data", value => { output = (output + value).slice(0, 8192); });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error("Printer command failed. Check the configured queue; do not automatically retry a submission."));
      else resolve(output);
    });
    child.stdin.end(input);
  });
}

export function createCups(run = command) {
  return {
    async inspect(printer) {
      validatePrinter(printer);
      const output = await run("/usr/bin/lpstat", ["-h", "localhost", "-v", printer]);
      const uri = output.trim().split(/:\s+/).slice(1).join(": ");
      if (!/^(ipps?|socket|lpd|usb|dnssd):\/\//i.test(uri)) throw new Error("The configured queue is missing or uses an unsupported/file output device. Use a physical printer queue.");
      return { printer, ready: true };
    },
    async submit(printer, pdf, preferences) {
      validatePrinter(printer);
      if (!Number.isInteger(preferences.copies) || preferences.copies < 1 || preferences.copies > 99 || !["SINGLE", "DOUBLE"].includes(preferences.sides) || !["BW", "COLOR", "AUTO"].includes(preferences.colorMode)) throw new Error("Invalid printer preferences.");
      const args = ["-h", "localhost", "-d", printer, "-t", "ZDrop temporary job", "-n", String(preferences.copies), "-o", "collate=true", "-o", "job-sheets=none", "-o", `sides=${preferences.sides === "DOUBLE" ? "two-sided-long-edge" : "one-sided"}`, "-o", `print-color-mode=${({ BW: "monochrome", COLOR: "color", AUTO: "auto" })[preferences.colorMode]}`];
      const output = await run("/usr/bin/lp", args, pdf);
      const id = output.match(/^request id is ([A-Za-z0-9_.-]+-\d+)\b/m)?.[1];
      if (!id || !id.startsWith(printer + "-")) throw new Error("Printer submission could not be confirmed. Do not automatically resubmit.");
      return id;
    },
    async cancel(printer, jobId) {
      validatePrinter(printer);
      if (!new RegExp(`^${printer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[0-9]+$`).test(jobId || "")) throw new Error("Only a job from the configured queue can be cancelled.");
      await run("/usr/bin/cancel", ["-h", "localhost", "-x", jobId]);
    },
  };
}
