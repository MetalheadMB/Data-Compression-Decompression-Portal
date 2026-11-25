# Data Compression & Decompression Portal

A browser-based portal that compresses and decompresses files with three algorithms implemented from scratch in TypeScript: **Huffman coding**, **run-length encoding (RLE)** and **LZ77**. Every compression is verified by decompressing the output and comparing it byte for byte with the original. Files never leave the browser.

## Features

- **Lossless round trips for all three algorithms**, covered by an automated test suite (`npm test`)
- **Real output files**: bit-packed into a `Uint8Array` behind a small header, saved as `.cmpz`. Upload a `.cmpz` file to decompress it later.
- **Measured results**: the compression ratio and space saved come from the actual output file, header and code table included. Compress and decompress throughput are shown in MB/s.
- **Live progress** from a Web Worker, so the page stays responsive on large files (up to 50 MB)
- **CRC-32 integrity check**: corrupted `.cmpz` files are rejected instead of silently producing wrong data
- Works on any file type, because the algorithms operate on raw bytes

## Algorithms

| | Huffman coding | Run-length encoding | LZ77 |
|---|---|---|---|
| Exploits | Some byte values are more common than others | Runs of the same byte | Repeated byte sequences |
| Output | Variable-length bit code per byte | PackBits packets | Literals and 2-byte (offset, length) pointers |
| Complexity | O(n + k log k), k = distinct bytes | O(n) | O(n × max chain length) |
| Good for | Text, source code | Bitmaps with flat areas, sparse data | Text, JSON, logs, code |

### Huffman coding (`src/compression/huffman.ts`)

1. Count the frequency of each byte value.
2. Build the tree with a **binary min-heap**: repeatedly pop the two lightest nodes and push their merged parent. That's O(k log k).
3. Take each byte's code length from its depth in the tree, then assign **canonical codes**: sort by (length, byte) and number the codes consecutively.
4. Write the **code table** (count, then one `(byte, length)` pair per symbol), then the codes **bit-packed** MSB-first.
5. The decoder rebuilds the same canonical codes from the lengths alone and reads one bit at a time.

### Run-length encoding (`src/compression/rle.ts`)

PackBits-style. A control byte `0–127` means "copy the next `n + 1` bytes literally". A control byte `128–255` means "repeat the next byte `n − 125` times" (runs of 3–130). Counts are never confused with data, and incompressible input grows by at most 1 byte per 128.

### LZ77 (`src/compression/lz77.ts`)

LZSS-style tokens with a **4 KB sliding window** and matches of **3–18 bytes**. Each match fits in 2 bytes: 12 bits of offset and 4 bits of length. Eight tokens share a flag byte saying which are literals and which are matches. Matches are found with **hash chains** (like zlib): a hash of the next 3 bytes leads to earlier positions with the same prefix, and up to 128 candidates are checked. Matches may overlap the bytes being written; the decoder copies byte by byte, so this works.

## File format (`.cmpz`)

| Bytes | Content |
|---|---|
| 0–3 | Magic `CMPZ` |
| 4 | Format version (`1`) |
| 5 | Algorithm (`1` Huffman, `2` RLE, `3` LZ77) |
| 6–9 | Original size (u32, big-endian) |
| 10–13 | CRC-32 of the original |
| 14– | Algorithm payload |

## Benchmarks

10 MB of real text (README and TypeScript declaration files), Node 22. Ratio = original ÷ compressed.

| Algorithm | Ratio | Compress | Decompress |
|---|---|---|---|
| Huffman | 1.46:1 | ~30 MB/s | ~27 MB/s |
| RLE | 1.02:1 | ~130 MB/s | ~240 MB/s |
| LZ77 | 3.71:1 | ~44 MB/s | ~210 MB/s |
| gzip -6 (reference) | 6.47:1 | | |

gzip uses DEFLATE, which runs LZ77 with a 32 KB window and then Huffman-codes the result. That's why it beats either algorithm on its own. Random data doesn't compress: LZ77 grows it by about 12.5%, because every byte becomes a literal costing 9 bits.

## Project structure

```
project/
├── src/
│   ├── compression/          # Pure algorithm code, no React
│   │   ├── bytes.ts          # Byte/bit readers and writers, CRC-32
│   │   ├── huffman.ts        # Min-heap, canonical codes, encode/decode
│   │   ├── rle.ts            # PackBits RLE
│   │   ├── lz77.ts           # LZSS tokens with hash-chain matching
│   │   ├── container.ts      # .cmpz header, dispatch, CRC check
│   │   └── roundtrip.test.ts # Round-trip and format tests (Vitest)
│   ├── workers/
│   │   ├── compression.worker.ts  # Runs compress + verify off the main thread
│   │   └── protocol.ts            # Message types and runInWorker()
│   ├── components/           # Upload, algorithm picker, progress, results
│   ├── types/
│   └── App.tsx               # Screen flow: upload → algorithm → processing → results
└── vite.config.ts
```

## Getting started

```bash
cd project
npm install
npm run dev        # http://localhost:5173
npm test           # round-trip test suite
npm run lint
npm run typecheck
npm run build
```

## Deployment

Deployed on **Vercel**, which rebuilds on every push to `main` (Root Directory: `project`, Framework: Vite, Build: `npm run build`, Output: `dist`). It's a static site with no server.

`.github/workflows/ci.yml` runs lint, typecheck, tests and build on every push and pull request.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Lucide icons · Vitest

---

**Made with ❤️ by Mitul**
