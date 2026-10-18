// Reject oversized pixel buffers before the native decoder allocates memory.
export function validateImageDimensions(bytes: Buffer, type: string) {
  // Inspect dimensions before decoding image pixels.
  let width = 0,
    height = 0;
  if (type === "image/png" && bytes.length >= 24) {
    width = bytes.readUInt32BE(16);
    height = bytes.readUInt32BE(20);
  } else if (type === "image/jpeg") {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset++] !== 0xff) continue;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (
        marker === 0x00 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      )
        continue;
      const length = bytes.readUInt16BE(offset);
      if (length < 2) break;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        height = bytes.readUInt16BE(offset + 3);
        width = bytes.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  }
  if (!(width > 0 && height > 0) || width > 20000 || height > 20000) throw new Error("This image is too large or invalid.");
  if (width * height > 40_000_000)
    throw new Error("This image is too large to render safely.");
  return { width, height };
}
