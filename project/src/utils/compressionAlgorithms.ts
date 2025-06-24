import { CompressionResult, ProcessingProgress } from '../types';

// Huffman Coding Implementation
class HuffmanNode {
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;

  constructor(char: string | null, freq: number) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildFrequencyTable(data: string): Map<string, number> {
  const freqTable = new Map<string, number>();
  for (const char of data) {
    freqTable.set(char, (freqTable.get(char) || 0) + 1);
  }
  return freqTable;
}

function buildHuffmanTree(freqTable: Map<string, number>): HuffmanNode | null {
  const nodes: HuffmanNode[] = [];
  
  for (const [char, freq] of freqTable) {
    nodes.push(new HuffmanNode(char, freq));
  }

  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    
    const left = nodes.shift()!;
    const right = nodes.shift()!;
    
    const parent = new HuffmanNode(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;
    
    nodes.push(parent);
  }

  return nodes[0];
}

function generateCodes(root: HuffmanNode | null, code = '', codes: Map<string, string> = new Map()): Map<string, string> {
  if (!root) return codes;

  if (root.char !== null) {
    codes.set(root.char, code || '0');
    return codes;
  }

  generateCodes(root.left, code + '0', codes);
  generateCodes(root.right, code + '1', codes);
  
  return codes;
}

export function huffmanCompress(data: string, onProgress?: (progress: ProcessingProgress) => void): CompressionResult {
  const startTime = performance.now();
  
  onProgress?.({ stage: 'Analyzing', progress: 10, message: 'Building frequency table...' });
  const freqTable = buildFrequencyTable(data);
  
  onProgress?.({ stage: 'Building Tree', progress: 30, message: 'Constructing Huffman tree...' });
  const root = buildHuffmanTree(freqTable);
  
  onProgress?.({ stage: 'Generating Codes', progress: 50, message: 'Creating character codes...' });
  const codes = generateCodes(root);
  
  onProgress?.({ stage: 'Compressing', progress: 70, message: 'Encoding data...' });
  let compressed = '';
  for (const char of data) {
    compressed += codes.get(char) || '';
  }

  // Convert binary string to bytes for realistic size calculation
  const compressedBytes = Math.ceil(compressed.length / 8);
  const headerSize = JSON.stringify(Object.fromEntries(codes)).length;
  
  onProgress?.({ stage: 'Complete', progress: 100, message: 'Compression complete!' });
  
  const endTime = performance.now();
  const originalSize = new Blob([data]).size;
  const compressedSize = compressedBytes + headerSize;

  return {
    originalSize,
    compressedSize,
    compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
    processingTime: endTime - startTime,
    algorithm: 'Huffman Coding',
    compressedData: compressed,
    originalData: data
  };
}

// Run-Length Encoding Implementation
export function rleCompress(data: string, onProgress?: (progress: ProcessingProgress) => void): CompressionResult {
  const startTime = performance.now();
  
  onProgress?.({ stage: 'Analyzing', progress: 20, message: 'Scanning for repetitions...' });
  
  let compressed = '';
  let i = 0;
  
  while (i < data.length) {
    onProgress?.({ stage: 'Compressing', progress: 20 + (i / data.length) * 60, message: `Processing character ${i + 1}/${data.length}...` });
    
    const currentChar = data[i];
    let count = 1;
    
    while (i + count < data.length && data[i + count] === currentChar && count < 255) {
      count++;
    }
    
    if (count > 3 || (count > 1 && /[^a-zA-Z0-9]/.test(currentChar))) {
      compressed += `${count}${currentChar}`;
    } else {
      compressed += currentChar.repeat(count);
    }
    
    i += count;
  }
  
  onProgress?.({ stage: 'Complete', progress: 100, message: 'RLE compression complete!' });
  
  const endTime = performance.now();
  const originalSize = new Blob([data]).size;
  const compressedSize = new Blob([compressed]).size;

  return {
    originalSize,
    compressedSize,
    compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
    processingTime: endTime - startTime,
    algorithm: 'Run-Length Encoding',
    compressedData: compressed,
    originalData: data
  };
}

// LZ77 Implementation (Simplified)
export function lz77Compress(data: string, onProgress?: (progress: ProcessingProgress) => void): CompressionResult {
  const startTime = performance.now();
  const windowSize = 4096;
  const lookAheadSize = 18;
  
  onProgress?.({ stage: 'Initializing', progress: 10, message: 'Setting up LZ77 compression...' });
  
  const compressed: Array<{ offset: number; length: number; nextChar: string }> = [];
  let i = 0;
  
  while (i < data.length) {
    onProgress?.({ stage: 'Compressing', progress: 10 + (i / data.length) * 80, message: `Processing position ${i + 1}/${data.length}...` });
    
    const windowStart = Math.max(0, i - windowSize);
    const window = data.substring(windowStart, i);
    const lookAhead = data.substring(i, i + lookAheadSize);
    
    let bestMatch = { offset: 0, length: 0 };
    
    for (let j = 0; j < window.length; j++) {
      let matchLength = 0;
      while (
        matchLength < lookAhead.length &&
        matchLength < lookAheadSize &&
        window[j + matchLength] === lookAhead[matchLength]
      ) {
        matchLength++;
      }
      
      if (matchLength > bestMatch.length) {
        bestMatch = { offset: window.length - j, length: matchLength };
      }
    }
    
    const nextChar = i + bestMatch.length < data.length ? data[i + bestMatch.length] : '';
    compressed.push({
      offset: bestMatch.offset,
      length: bestMatch.length,
      nextChar
    });
    
    i += Math.max(1, bestMatch.length);
  }
  
  onProgress?.({ stage: 'Complete', progress: 100, message: 'LZ77 compression complete!' });
  
  const endTime = performance.now();
  const originalSize = new Blob([data]).size;
  const compressedSize = compressed.length * 6; // Rough estimate for triplet encoding
  
  return {
    originalSize,
    compressedSize,
    compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
    processingTime: endTime - startTime,
    algorithm: 'LZ77',
    compressedData: JSON.stringify(compressed),
    originalData: data
  };
}

export function decompressData(compressedData: string, algorithm: string): string {
  switch (algorithm) {
    case 'Run-Length Encoding':
      return rleDecompress(compressedData);
    case 'LZ77':
      return lz77Decompress(compressedData);
    case 'Huffman Coding':
      // Huffman decompression would require the code table
      return 'Huffman decompression requires the original code table';
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

function rleDecompress(compressed: string): string {
  let decompressed = '';
  let i = 0;
  
  while (i < compressed.length) {
    if (/\d/.test(compressed[i])) {
      let numStr = '';
      while (i < compressed.length && /\d/.test(compressed[i])) {
        numStr += compressed[i];
        i++;
      }
      const count = parseInt(numStr);
      const char = compressed[i];
      decompressed += char.repeat(count);
      i++;
    } else {
      decompressed += compressed[i];
      i++;
    }
  }
  
  return decompressed;
}

function lz77Decompress(compressed: string): string {
  const tokens = JSON.parse(compressed);
  let decompressed = '';
  
  for (const token of tokens) {
    if (token.length > 0) {
      const start = decompressed.length - token.offset;
      for (let i = 0; i < token.length; i++) {
        decompressed += decompressed[start + i];
      }
    }
    if (token.nextChar) {
      decompressed += token.nextChar;
    }
  }
  
  return decompressed;
}