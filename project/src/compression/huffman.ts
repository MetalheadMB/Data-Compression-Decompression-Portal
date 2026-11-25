/**
 * Huffman coding over bytes.
 *
 * Payload layout:
 *   u16 symbolCount                      (0..256)
 *   symbolCount × { u8 symbol, u8 codeLength }   <- serialized code table
 *   packed code bits, MSB first, last byte zero-padded
 *
 * Only code lengths are stored. Both sides assign "canonical" codes from the
 * lengths in the same fixed order, so the decoder rebuilds the exact codes.
 */
import { BitReader, BitWriter, ByteReader, ByteWriter, ProgressFn, throttleProgress } from './bytes';

interface Node {
  weight: number;
  order: number; // tie-breaker so the tree is deterministic
  symbol: number; // -1 for internal nodes
  left: Node | null;
  right: Node | null;
}

/** Binary min-heap ordered by (weight, order). push/pop are O(log k). */
export class MinHeap {
  private items: Node[] = [];

  get size(): number {
    return this.items.length;
  }

  private less(a: Node, b: Node): boolean {
    return a.weight < b.weight || (a.weight === b.weight && a.order < b.order);
  }

  push(node: Node): void {
    const a = this.items;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(a[i], a[parent])) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      i = parent;
    }
  }

  pop(): Node {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < a.length && this.less(a[l], a[smallest])) smallest = l;
        if (r < a.length && this.less(a[r], a[smallest])) smallest = r;
        if (smallest === i) break;
        [a[i], a[smallest]] = [a[smallest], a[i]];
        i = smallest;
      }
    }
    return top;
  }
}

/** Returns a code length per byte value (0 = byte not present). O(n + k log k). */
export function buildCodeLengths(data: Uint8Array): Uint8Array {
  const freq = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) freq[data[i]]++;

  const heap = new MinHeap();
  let order = 0;
  for (let s = 0; s < 256; s++) {
    if (freq[s] > 0) heap.push({ weight: freq[s], order: order++, symbol: s, left: null, right: null });
  }

  const lengths = new Uint8Array(256);
  if (heap.size === 0) return lengths;
  if (heap.size === 1) {
    // A file with one distinct byte still needs a 1-bit code.
    lengths[heap.pop().symbol] = 1;
    return lengths;
  }

  // Greedy step: always merge the two lightest subtrees.
  while (heap.size > 1) {
    const a = heap.pop();
    const b = heap.pop();
    heap.push({ weight: a.weight + b.weight, order: order++, symbol: -1, left: a, right: b });
  }

  // Depth of each leaf = its code length. Iterative to avoid deep recursion.
  const stack: Array<[Node, number]> = [[heap.pop(), 0]];
  while (stack.length) {
    const [node, depth] = stack.pop()!;
    if (node.symbol >= 0) lengths[node.symbol] = depth;
    else {
      stack.push([node.left!, depth + 1]);
      stack.push([node.right!, depth + 1]);
    }
  }
  return lengths;
}

/** Symbols present, sorted by (length, symbol): the canonical order. */
function canonicalOrder(lengths: Uint8Array): number[] {
  const symbols: number[] = [];
  for (let s = 0; s < 256; s++) if (lengths[s] > 0) symbols.push(s);
  return symbols.sort((a, b) => lengths[a] - lengths[b] || a - b);
}

/** Assigns canonical codes: consecutive integers, shifted left whenever the length grows. */
export function canonicalCodes(lengths: Uint8Array): Float64Array {
  const codes = new Float64Array(256);
  let code = 0;
  let prevLen = 0;
  for (const s of canonicalOrder(lengths)) {
    code *= 2 ** (lengths[s] - prevLen);
    codes[s] = code;
    code += 1;
    prevLen = lengths[s];
  }
  return codes;
}

export function huffmanCompress(data: Uint8Array, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const lengths = buildCodeLengths(data);
  const codes = canonicalCodes(lengths);
  const present = canonicalOrder(lengths);

  const out = new ByteWriter(Math.ceil(data.length / 2) + 600);
  out.writeUint16(present.length);
  for (const s of present) {
    out.writeByte(s);
    out.writeByte(lengths[s]);
  }

  const bits = new BitWriter(out);
  for (let i = 0; i < data.length; i++) {
    const s = data[i];
    bits.writeBits(codes[s], lengths[s]);
    if ((i & 0xffff) === 0) progress(i / data.length);
  }
  bits.flush();
  progress(1);
  return out.toBytes();
}

export function huffmanDecompress(payload: Uint8Array, originalLength: number, onProgress?: ProgressFn): Uint8Array {
  const progress = throttleProgress(onProgress);
  const reader = new ByteReader(payload);
  const symbolCount = reader.readUint16();
  if (symbolCount > 256) throw new Error('Corrupt Huffman header');

  const lengths = new Uint8Array(256);
  for (let i = 0; i < symbolCount; i++) {
    const s = reader.readByte();
    const len = reader.readByte();
    if (len === 0) throw new Error('Corrupt Huffman header');
    lengths[s] = len;
  }
  const out = new Uint8Array(originalLength);
  if (originalLength === 0) return out;
  if (symbolCount === 0) throw new Error('Corrupt Huffman header');

  // Canonical decoding tables: for each length, how many codes it has,
  // the first code value, and where its symbols start in the sorted list.
  const sorted = canonicalOrder(lengths);
  const maxLen = lengths[sorted[sorted.length - 1]];
  const count = new Array<number>(maxLen + 1).fill(0);
  for (const s of sorted) count[lengths[s]]++;
  const firstCode = new Array<number>(maxLen + 1).fill(0);
  const firstIndex = new Array<number>(maxLen + 1).fill(0);
  let code = 0;
  let index = 0;
  for (let len = 1; len <= maxLen; len++) {
    code *= 2;
    firstCode[len] = code;
    firstIndex[len] = index;
    code += count[len];
    index += count[len];
  }

  const bits = new BitReader(payload, reader.pos);
  for (let i = 0; i < originalLength; i++) {
    let value = 0;
    let len = 0;
    for (;;) {
      value = value * 2 + bits.readBit();
      len++;
      if (len > maxLen) throw new Error('Corrupt Huffman data');
      const offset = value - firstCode[len];
      if (offset < count[len]) {
        out[i] = sorted[firstIndex[len] + offset];
        break;
      }
    }
    if ((i & 0xffff) === 0) progress(i / originalLength);
  }
  progress(1);
  return out;
}
