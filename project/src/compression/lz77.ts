/**
 * LZ77 over bytes, using LZSS-style tokens.
 *
 * Window: 4096 bytes. Matches: 3..18 bytes. A match is packed into 2 bytes:
 * 12 bits of (offset - 1) and 4 bits of (length - 3). Shorter matches cost
 * more than the bytes they replace, so they are written as literals.
 *
 * Tokens are grouped in eights behind a flag byte: bit k (LSB first) is 1
 * if token k is a match, 0 if it is a single literal byte.
 *
 * Match finding uses hash chains (like zlib): a hash of the next 3 bytes points
 * to the most recent position with that hash, and `prev` links each position
 * to the previous one with the same hash. Only those candidates are checked,
 * up to MAX_CHAIN of them, instead of every position in the window.
 */
import { ByteWriter, ProgressFn, throttleProgress } from './bytes';

export const WINDOW_SIZE = 4096;
export const MIN_MATCH = 3;
export const MAX_MATCH = 18;
const MAX_CHAIN = 128;
const HASH_BITS = 15;
const HASH_SIZE = 1 << HASH_BITS;
const WINDOW_MASK = WINDOW_SIZE - 1;

function hash3(data: Uint8Array, i: number): number {
  return (((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]) * 2654435761) >>> (32 - HASH_BITS);
}

export function lz77Compress(data: Uint8Array, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const n = data.length;
  const out = new ByteWriter(n + (n >> 3) + 16);
  const head = new Int32Array(HASH_SIZE).fill(-1);
  const prev = new Int32Array(WINDOW_SIZE).fill(-1); // ring buffer indexed by position % window

  const insert = (pos: number) => {
    if (pos + MIN_MATCH > n) return;
    const h = hash3(data, pos);
    prev[pos & WINDOW_MASK] = head[h];
    head[h] = pos;
  };

  let flagIndex = -1;
  let flags = 0;
  let tokenCount = 0;
  let i = 0;

  while (i < n) {
    if (tokenCount === 0) {
      flagIndex = out.reserveByte();
      flags = 0;
    }

    let bestLen = 0;
    let bestDist = 0;
    if (i + MIN_MATCH <= n) {
      const maxLen = Math.min(MAX_MATCH, n - i);
      let cand = head[hash3(data, i)];
      let chain = MAX_CHAIN;
      while (cand >= 0 && i - cand <= WINDOW_SIZE && chain-- > 0) {
        // Matches may run past i (overlap): the decoder copies byte by byte.
        let len = 0;
        while (len < maxLen && data[cand + len] === data[i + len]) len++;
        if (len > bestLen) {
          bestLen = len;
          bestDist = i - cand;
          if (len === maxLen) break;
        }
        const next = prev[cand & WINDOW_MASK];
        if (next >= cand) break; // stale ring-buffer entry
        cand = next;
      }
    }

    if (bestLen >= MIN_MATCH) {
      flags |= 1 << tokenCount;
      const offset = bestDist - 1; // 0..4095 -> 12 bits
      const length = bestLen - MIN_MATCH; // 0..15 -> 4 bits
      out.writeByte(offset >>> 4);
      out.writeByte(((offset & 0x0f) << 4) | length);
      for (let k = 0; k < bestLen; k++) insert(i + k);
      i += bestLen;
    } else {
      out.writeByte(data[i]);
      insert(i);
      i += 1;
    }

    if (++tokenCount === 8) {
      out.setByte(flagIndex, flags);
      tokenCount = 0;
    }
    if ((i & 0x3fff) < MAX_MATCH) progress(i / n);
  }
  if (tokenCount > 0) out.setByte(flagIndex, flags);
  progress(1);
  return out.toBytes();
}

export function lz77Decompress(payload: Uint8Array, originalLength: number, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const out = new Uint8Array(originalLength);
  let o = 0;
  let p = 0;
  while (o < originalLength) {
    if (p >= payload.length) throw new Error('Corrupt LZ77 data');
    const flags = payload[p++];
    for (let bit = 0; bit < 8 && o < originalLength; bit++) {
      if (flags & (1 << bit)) {
        if (p + 1 >= payload.length) throw new Error('Corrupt LZ77 data');
        const b1 = payload[p++];
        const b2 = payload[p++];
        const dist = ((b1 << 4) | (b2 >>> 4)) + 1;
        const len = (b2 & 0x0f) + MIN_MATCH;
        let src = o - dist;
        if (src < 0 || o + len > originalLength) throw new Error('Corrupt LZ77 data');
        for (let k = 0; k < len; k++) out[o++] = out[src++]; // byte by byte: handles overlap
      } else {
        if (p >= payload.length) throw new Error('Corrupt LZ77 data');
        out[o++] = payload[p++];
      }
    }
    if ((o & 0x3fff) < 160) progress(o / originalLength);
  }
  progress(1);
  return out;
}
