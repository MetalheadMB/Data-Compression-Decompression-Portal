/**
 * Low-level byte and bit helpers shared by all three algorithms.
 */

export type ProgressFn = (fraction: number) => void;

/**
 * Wraps a progress callback so it only fires when the whole-percent value
 * changes. Algorithms can call it on every step without flooding the UI.
 */
export function throttleProgress(onProgress?: ProgressFn): ProgressFn {
  let last = -1;
  return (fraction: number) => {
    if (!onProgress) return;
    const pct = Math.floor(fraction * 100);
    if (pct !== last) {
      last = pct;
      onProgress(Math.min(1, Math.max(0, fraction)));
    }
  };
}

/** Growable byte buffer: amortised O(1) appends, like a dynamic array. */
export class ByteWriter {
  private buf: Uint8Array;
  private len = 0;

  constructor(initialCapacity = 1024) {
    this.buf = new Uint8Array(Math.max(16, initialCapacity));
  }

  private ensure(extra: number): void {
    if (this.len + extra <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + extra) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }

  get length(): number {
    return this.len;
  }

  writeByte(b: number): void {
    this.ensure(1);
    this.buf[this.len++] = b & 0xff;
  }

  writeBytes(bytes: Uint8Array): void {
    this.ensure(bytes.length);
    this.buf.set(bytes, this.len);
    this.len += bytes.length;
  }

  writeUint16(v: number): void {
    this.writeByte(v >>> 8);
    this.writeByte(v);
  }

  writeUint32(v: number): void {
    this.writeByte(v >>> 24);
    this.writeByte(v >>> 16);
    this.writeByte(v >>> 8);
    this.writeByte(v);
  }

  /** Reserves one byte and returns its index so it can be filled in later. */
  reserveByte(): number {
    this.ensure(1);
    return this.len++;
  }

  setByte(index: number, b: number): void {
    this.buf[index] = b & 0xff;
  }

  toBytes(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

/** Reads big-endian integers from a byte array, with bounds checks. */
export class ByteReader {
  pos = 0;
  constructor(private readonly data: Uint8Array) {}

  get remaining(): number {
    return this.data.length - this.pos;
  }

  readByte(): number {
    if (this.pos >= this.data.length) throw new Error('Unexpected end of data');
    return this.data[this.pos++];
  }

  readUint16(): number {
    return (this.readByte() << 8) | this.readByte();
  }

  readUint32(): number {
    return ((this.readByte() << 24) | (this.readByte() << 16) | (this.readByte() << 8) | this.readByte()) >>> 0;
  }
}

/** Packs bits MSB-first into bytes. */
export class BitWriter {
  private out: ByteWriter;
  private cur = 0;
  private nbits = 0;

  constructor(out: ByteWriter) {
    this.out = out;
  }

  /** Writes the low `len` bits of `value`, most significant first. Supports len up to 53. */
  writeBits(value: number, len: number): void {
    if (len > 24) {
      const lowLen = 24;
      const high = Math.floor(value / 2 ** lowLen);
      this.writeBits(high, len - lowLen);
      this.writeBits(value % 2 ** lowLen, lowLen);
      return;
    }
    for (let i = len - 1; i >= 0; i--) {
      this.cur = (this.cur << 1) | ((value >>> i) & 1);
      this.nbits++;
      if (this.nbits === 8) {
        this.out.writeByte(this.cur);
        this.cur = 0;
        this.nbits = 0;
      }
    }
  }

  /** Pads the last partial byte with zero bits. */
  flush(): void {
    if (this.nbits > 0) {
      this.out.writeByte(this.cur << (8 - this.nbits));
      this.cur = 0;
      this.nbits = 0;
    }
  }
}

/** Reads bits MSB-first. */
export class BitReader {
  private bytePos: number;
  private bitPos = 0;

  constructor(private readonly data: Uint8Array, start = 0) {
    this.bytePos = start;
  }

  readBit(): number {
    if (this.bytePos >= this.data.length) throw new Error('Unexpected end of bit stream');
    const bit = (this.data[this.bytePos] >>> (7 - this.bitPos)) & 1;
    if (++this.bitPos === 8) {
      this.bitPos = 0;
      this.bytePos++;
    }
    return bit;
  }
}

// CRC-32 (IEEE 802.3, the same checksum zip and gzip use).
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
