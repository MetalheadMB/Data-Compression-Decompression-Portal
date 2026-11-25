import { describe, expect, it } from 'vitest';
import { compress, decompress, HEADER_SIZE, isCompressedFile } from './container';
import { buildCodeLengths, canonicalCodes, MinHeap } from './huffman';
import { crc32 } from './bytes';
import type { CompressionAlgorithm } from '../types';

const ALGORITHMS: CompressionAlgorithm[] = ['huffman', 'rle', 'lz77'];
const enc = (s: string) => new TextEncoder().encode(s);

// Deterministic pseudo-random bytes so failures are reproducible.
function randomBytes(n: number, seed = 1, alphabet = 256): Uint8Array {
  const out = new Uint8Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out[i] = (x >>> 16) % alphabet;
  }
  return out;
}

const CASES: Record<string, Uint8Array> = {
  empty: new Uint8Array(0),
  'one byte': enc('a'),
  'one distinct byte': enc('aaaaaaaaaaaaaaaaaaaa'),
  'digits (old RLE bug)': enc('Order 1234 shipped on 2025-06-25, qty 5'),
  'digit runs (old RLE bug)': enc('x5555y 0000000000 999'),
  'repeats (old LZ77 bug)': enc('abcabcabcabcabcXYZ'),
  'overlapping match': enc('a'.repeat(1000) + 'b'),
  unicode: enc('héllo wörld ✓✓✓✓✓ 你好 🙂🙂'),
  'long run > 130': new Uint8Array(1000).fill(7),
  'literal block > 128': randomBytes(300, 3),
  'all 256 byte values': Uint8Array.from({ length: 256 }, (_, i) => i),
  'random binary 64 KB': randomBytes(65536, 42),
  'low-entropy 64 KB': randomBytes(65536, 9, 4),
  'repeated JSON': enc(JSON.stringify(Array.from({ length: 300 }, (_, i) => ({ id: i, status: 'shipped', qty: i % 7 })))),
  'repeat at window edge': (() => {
    const block = randomBytes(4096, 5);
    const out = new Uint8Array(4096 * 3);
    out.set(block, 0);
    out.set(block, 4096);
    out.set(block, 8192);
    return out;
  })(),
};

describe('round trip: decompress(compress(x)) === x', () => {
  for (const algorithm of ALGORITHMS) {
    for (const [name, input] of Object.entries(CASES)) {
      it(`${algorithm}: ${name}`, () => {
        const packed = compress(input, algorithm);
        expect(isCompressedFile(packed)).toBe(true);
        const { algorithm: detected, data } = decompress(packed);
        expect(detected).toBe(algorithm);
        expect(data).toEqual(input);
      });
    }
  }

  it('random inputs of many sizes, all algorithms', () => {
    for (let n = 0; n < 600; n += 37) {
      for (const alphabet of [2, 5, 256]) {
        const input = randomBytes(n, n + alphabet, alphabet);
        for (const algorithm of ALGORITHMS) {
          expect(decompress(compress(input, algorithm)).data).toEqual(input);
        }
      }
    }
  });
});

describe('compression actually shrinks suitable data', () => {
  const text = enc('the quick brown fox jumps over the lazy dog. '.repeat(400));

  it('Huffman packs text below 8 bits per character', () => {
    expect(compress(text, 'huffman').length).toBeLessThan(text.length * 0.7);
  });
  it('LZ77 shrinks repetitive text a lot', () => {
    expect(compress(text, 'lz77').length).toBeLessThan(text.length * 0.2);
  });
  it('RLE shrinks long runs', () => {
    expect(compress(new Uint8Array(10000).fill(1), 'rle').length).toBeLessThan(200);
  });
  it('RLE grows data with no runs by at most 1 byte per 128', () => {
    const noRuns = Uint8Array.from({ length: 12800 }, (_, i) => i % 251);
    expect(compress(noRuns, 'rle').length).toBeLessThanOrEqual(HEADER_SIZE + 12800 + 100);
  });
});

describe('format safety', () => {
  it('rejects a file whose bytes were changed', () => {
    const packed = compress(enc('hello hello hello hello world'), 'lz77');
    packed[packed.length - 1] ^= 0xff;
    expect(() => decompress(packed)).toThrow();
  });
  it('rejects files that are not .cmpz', () => {
    expect(() => decompress(enc('plain text, not compressed'))).toThrow('Not a .cmpz file');
  });
  it('CRC-32 matches the standard check value', () => {
    expect(crc32(enc('123456789'))).toBe(0xcbf43926);
  });
});

describe('Huffman internals', () => {
  it('min-heap pops in weight order', () => {
    const heap = new MinHeap();
    [5, 1, 4, 2, 3].forEach((w, order) => heap.push({ weight: w, order, symbol: w, left: null, right: null }));
    expect([1, 2, 3, 4, 5].map(() => heap.pop().weight)).toEqual([1, 2, 3, 4, 5]);
  });
  it('gives frequent bytes shorter codes (aaaabbc -> a:1, b:2, c:2)', () => {
    const lengths = buildCodeLengths(enc('aaaabbc'));
    expect([lengths[97], lengths[98], lengths[99]]).toEqual([1, 2, 2]);
  });
  it('canonical codes are prefix-free', () => {
    const lengths = buildCodeLengths(randomBytes(5000, 11, 40));
    const codes = canonicalCodes(lengths);
    const strs: string[] = [];
    for (let s = 0; s < 256; s++) if (lengths[s]) strs.push(codes[s].toString(2).padStart(lengths[s], '0'));
    for (const a of strs) for (const b of strs) if (a !== b) expect(b.startsWith(a)).toBe(false);
  });
});
