import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Synthetic content only; this fixture never uploads or prints automatically.
const pdf = await PDFDocument.create();
const regular = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
const mm = value => value * 72 / 25.4;
for (let number = 1; number <= 2; number++) {
  const page = pdf.addPage([mm(210), mm(297)]);
  const text = (value, x, y, size = 11, strong = false) => page.drawText(value, { x, y, size, font: strong ? bold : regular, color: rgb(0.08, 0.12, 0.09) });
  const line = (x1, y1, x2, y2, thickness = 0.5) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0, 0, 0) });
  page.drawRectangle({ x: mm(10), y: mm(10), width: mm(190), height: mm(277), borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
  for (const x of [mm(15), mm(195)]) for (const y of [mm(15), mm(282)]) { line(x - 4, y, x + 4, y); line(x, y - 4, x, y + 4); }
  text("ZDrop / Printer acceptance", 45, 770, 23, true);
  text(`Page ${number} of 2 - ${number === 1 ? "FRONT" : "BACK"} - TOP EDGE`, 45, 742, 14, true);
  text("TEST DOCUMENT - NO CUSTOMER DATA", 45, 718, 10);
  line(45, 700, 550, 700);
  text(number === 1 ? "1. Text and detail" : "4. Duplex and page order", 45, 671, 15, true);
  if (number === 1) {
    let y = 642;
    for (const size of [6, 8, 10, 12]) { text(`${size} pt: ABCDEFG abcdefg 0123456789 - Print clearly.`, 45, y, size); y -= 27; }
    text("Fine rules: 0.25 / 0.5 / 0.75 / 1 pt", 45, 513, 10);
    [0.25, 0.5, 0.75, 1].forEach((width, index) => line(45, 496 - index * 13, 330, 496 - index * 13, width));
  } else {
    text("For two copies, double-sided, long-edge binding:", 45, 642, 12);
    text("Expect TWO sheets. Each has FRONT then BACK, both upright.", 45, 617, 11);
    text("For one copy, single-sided: expect TWO separate sheets.", 45, 592, 11);
    text("Page range 2 alone: expect BACK only.", 45, 567, 11);
    text("Cancellation: test a held synthetic job, then cancel its queue ID.", 45, 542, 10);
    text("A cancelled queue cannot recall sheets already printed.", 45, 517, 10);
    text("Check that all four corner marks are visible on both sides.", 45, 492, 11);
  }
  text(number === 1 ? "2. Color and grayscale" : "5. Compare both sides", 45, 417, 15, true);
  [rgb(0.9, 0.08, 0.1), rgb(0.06, 0.6, 0.25), rgb(0.05, 0.25, 0.9), rgb(0.9, 0.7, 0.03)].forEach((color, index) => {
    page.drawRectangle({ x: 45 + index * 120, y: 355, width: 105, height: 40, color });
    text(["RED", "GREEN", "BLUE", "YELLOW"][index], 45 + index * 120, 339, 9);
  });
  for (let index = 0; index < 10; index++) page.drawRectangle({ x: 45 + index * 48, y: 284, width: 48, height: 32, color: rgb(index / 9, index / 9, index / 9), borderWidth: 0.2, borderColor: rgb(0.5, 0.5, 0.5) });
  text("B&W mode: all color blocks should print in gray. Steps should remain distinct.", 45, 267, 10);
  text(number === 1 ? "3. Scale and margins" : "6. Scale and alignment", 45, 218, 15, true);
  text("Print at actual size / 100%. Measure the line: it should be 100 mm.", 45, 192, 10);
  line(45, 164, 45 + mm(100), 164, 1);
  for (let index = 0; index <= 10; index++) line(45 + mm(index * 10), 159, 45 + mm(index * 10), 169);
  text("0", 43, 143, 9); text("100 mm", 45 + mm(100) - 15, 143, 9);
  text("Record observed results. This sheet does not prove printer or storage deletion.", 45, 104, 9);
  text(`BOTTOM EDGE / ${number === 1 ? "FRONT" : "BACK"}`, 45, 77, 11, true);
}
const directory = new URL("../output/pdf/", import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL("printer-acceptance.pdf", directory), await pdf.save());
console.log("Created output/pdf/printer-acceptance.pdf. No job was uploaded or printed.");
