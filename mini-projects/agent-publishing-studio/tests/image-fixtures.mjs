import { deflateSync } from 'node:zlib';
import { crc32 } from '../lib/package.mjs';

// Small, deterministic PNGs keep the downloaded starter tests self-contained.
export function samplePng(dark = false) {
  const width = 320, height = 180, rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const color = x > 220 && y < 100 ? [234, 126, 70] : dark ? [24, 32, 48] : [240, 244, 250];
      row.set(color, x * 3 + 1);
    }
    rows.push(row);
  }
  const chunk = (name, data) => {
    const type = Buffer.from(name), size = Buffer.alloc(4), crc = Buffer.alloc(4);
    size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([size, type, data, crc]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}
