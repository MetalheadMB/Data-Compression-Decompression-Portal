/**
 * The .cmpz file format wrapping every compressed file:
 *
 *   bytes 0-3   magic "CMPZ"
 *   byte  4     format version (1)
 *   byte  5     algorithm id (1 = Huffman, 2 = RLE, 3 = LZ77)
 *   bytes 6-9   original size in bytes (u32, big-endian)
 *   bytes 10-13 CRC-32 of the original bytes
 *   bytes 14-   algorithm payload
 *
 * The header lets a file be decompressed later without knowing how it was made,
 * and the CRC proves the decompressed bytes are exactly the original.
 */
import { ByteReader, ByteWriter, ProgressFn, crc32 } from './bytes';
import { huffmanCompress, huffmanDecompress } from './huffman';
import { rleCompress, rleDecompress } from './rle';
import { lz77Compress, lz77Decompress } from './lz77';
import type { CompressionAlgorithm } from '../types';

const MAGIC = [0x43, 0x4d, 0x50, 0x5a]; // "CMPZ"
const VERSION = 1;
export const HEADER_SIZE = 14;

interface Codec {
  id: number;
  compress: (data: Uint8Array, onProgress?: ProgressFn) => Uint8Array;
  decompress: (payload: Uint8Array, originalLength: number, onProgress?: ProgressFn) => Uint8Array;
}

const CODECS: Record<CompressionAlgorithm, Codec> = {
  huffman: { id: 1, compress: huffmanCompress, decompress: huffmanDecompress },
  rle: { id: 2, compress: rleCompress, decompress: rleDecompress },
  lz77: { id: 3, compress: lz77Compress, decompress: lz77Decompress },
};

export function isCompressedFile(bytes: Uint8Array): boolean {
  return bytes.length >= HEADER_SIZE && MAGIC.every((b, i) => bytes[i] === b);
}

export function compress(data: Uint8Array, algorithm: CompressionAlgorithm, onProgress?: ProgressFn): Uint8Array {
  const codec = CODECS[algorithm];
  const payload = codec.compress(data, onProgress);
  const out = new ByteWriter(HEADER_SIZE + payload.length);
  MAGIC.forEach((b) => out.writeByte(b));
  out.writeByte(VERSION);
  out.writeByte(codec.id);
  out.writeUint32(data.length);
  out.writeUint32(crc32(data));
  out.writeBytes(payload);
  return out.toBytes();
}

export interface DecompressedFile {
  algorithm: CompressionAlgorithm;
  data: Uint8Array;
}

export function decompress(file: Uint8Array, onProgress?: ProgressFn): DecompressedFile {
  if (!isCompressedFile(file)) throw new Error('Not a .cmpz file');
  const reader = new ByteReader(file);
  reader.pos = MAGIC.length;
  const version = reader.readByte();
  if (version !== VERSION) throw new Error(`Unsupported format version ${version}`);
  const id = reader.readByte();
  const entry = (Object.entries(CODECS) as Array<[CompressionAlgorithm, Codec]>).find(([, c]) => c.id === id);
  if (!entry) throw new Error(`Unknown algorithm id ${id}`);
  const originalLength = reader.readUint32();
  const expectedCrc = reader.readUint32();

  const data = entry[1].decompress(file.subarray(HEADER_SIZE), originalLength, onProgress);
  if (crc32(data) !== expectedCrc) throw new Error('Checksum mismatch: the file is corrupt');
  return { algorithm: entry[0], data };
}
