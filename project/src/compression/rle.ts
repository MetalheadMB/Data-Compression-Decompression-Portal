/**
 * Run-length encoding over bytes, PackBits-style.
 *
 * The stream is a sequence of packets, each starting with a control byte:
 *   0..127   -> literal packet: the next (control + 1) bytes are copied as-is (1..128)
 *   128..255 -> run packet: repeat the next byte (control - 128 + 3) times (3..130)
 *
 * A count can never be confused with data (the old decimal format broke on any
 * text containing digits), and data with no runs grows by at most 1 byte per 128.
 */
import { ByteWriter, ProgressFn, throttleProgress } from './bytes';

const MAX_LITERAL = 128;
const MIN_RUN = 3;
const MAX_RUN = 130;

export function rleCompress(data: Uint8Array, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const out = new ByteWriter(data.length + (data.length >> 7) + 16);
  let litStart = 0; // start of the pending literal bytes
  let i = 0;

  const flushLiterals = (end: number) => {
    while (litStart < end) {
      const n = Math.min(MAX_LITERAL, end - litStart);
      out.writeByte(n - 1);
      out.writeBytes(data.subarray(litStart, litStart + n));
      litStart += n;
    }
  };

  while (i < data.length) {
    let run = 1;
    while (i + run < data.length && data[i + run] === data[i] && run < MAX_RUN) run++;

    if (run >= MIN_RUN) {
      flushLiterals(i);
      out.writeByte(128 + run - MIN_RUN);
      out.writeByte(data[i]);
      i += run;
      litStart = i;
    } else {
      i += run; // short runs stay in the literal packet
    }
    if ((i & 0xffff) < run) progress(i / data.length);
  }
  flushLiterals(data.length);
  progress(1);
  return out.toBytes();
}

export function rleDecompress(payload: Uint8Array, originalLength: number, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const out = new Uint8Array(originalLength);
  let o = 0;
  let p = 0;
  while (p < payload.length) {
    const control = payload[p++];
    if (control < 128) {
      const n = control + 1;
      if (p + n > payload.length || o + n > originalLength) throw new Error('Corrupt RLE data');
      out.set(payload.subarray(p, p + n), o);
      p += n;
      o += n;
    } else {
      const n = control - 128 + MIN_RUN;
      if (p >= payload.length || o + n > originalLength) throw new Error('Corrupt RLE data');
      out.fill(payload[p++], o, o + n);
      o += n;
    }
    if ((o & 0xffff) < 130) progress(o / Math.max(1, originalLength));
  }
  if (o !== originalLength) throw new Error('Corrupt RLE data: length mismatch');
  progress(1);
  return out;
}
