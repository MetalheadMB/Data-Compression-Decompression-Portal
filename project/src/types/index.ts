export type CompressionAlgorithm = 'huffman' | 'rle' | 'lz77';

/** Extension for files produced by this app (see src/compression/container.ts). */
export const COMPRESSED_EXTENSION = '.cmpz';

export const ALGORITHM_NAMES: Record<CompressionAlgorithm, string> = {
  huffman: 'Huffman Coding',
  rle: 'Run-Length Encoding',
  lz77: 'LZ77',
};

export interface AlgorithmInfo {
  name: string;
  description: string;
  complexity: string;
  bestFor: string[];
  worstFor: string[];
}

export interface ProcessingProgress {
  stage: string;
  progress: number; // 0..100
  message: string;
}

/** Result of compressing a file (mode 'compress') or opening a .cmpz file (mode 'decompress'). */
export interface CompressionResult {
  mode: 'compress' | 'decompress';
  algorithm: CompressionAlgorithm;
  fileName: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes of the real .cmpz file, header included
  compressMs: number | null; // null when we only decompressed
  decompressMs: number;
  verified: boolean; // decompressed bytes matched the original (and its CRC-32)
  output: Uint8Array; // the bytes to download
}
