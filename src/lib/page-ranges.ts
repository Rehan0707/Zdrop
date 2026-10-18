export function formatPageRanges(pages: number[]): string {
  const sorted = [...new Set(pages.filter((page) => Number.isInteger(page) && page > 0))]
    .sort((a, b) => a - b);
  if (sorted.length === 0) return "None";

  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;
  for (const page of sorted.slice(1)) {
    if (page === end + 1) {
      end = page;
      continue;
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = end = page;
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

export function parseSelectedPages(pageRange: string, documentPages: number): number[] {
  const pageCount = Math.max(1, documentPages);
  if (!pageRange || pageRange.trim().toUpperCase() === "ALL") {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const selected = new Set<number>();
  for (const part of pageRange.split(",")) {
    const [firstText, lastText] = part.trim().split(/\s*-\s*/);
    const first = Number(firstText);
    const last = lastText === undefined ? first : Number(lastText);
    if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) continue;
    for (let page = first; page <= Math.min(last, pageCount); page++) selected.add(page);
  }
  return [...selected].sort((a, b) => a - b);
}
