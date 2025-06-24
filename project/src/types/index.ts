export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
  algorithm: string;
  compressedData: string | Uint8Array;
  originalData: string | Uint8Array;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string | ArrayBuffer;
}

export interface AlgorithmInfo {
  name: string;
  description: string;
  complexity: string;
  bestFor: string[];
  worstFor: string[];
}

export type CompressionAlgorithm = 'huffman' | 'rle' | 'lz77';

export interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}