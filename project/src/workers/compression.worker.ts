/// <reference lib="webworker" />
/**
 * Runs compression off the main thread so the page stays responsive and the
 * progress bar can actually repaint while a large file is processed.
 */
import { compress, decompress } from '../compression/container';
import { bytesEqual } from '../compression/bytes';
import type { WorkerRequest, WorkerResponse } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

function post(msg: WorkerResponse, transfer: Transferable[] = []): void {
  self.postMessage(msg, transfer);
}

function progress(stage: string, message: string, from: number, to: number) {
  return (fraction: number) =>
    post({ type: 'progress', stage, message, progress: from + (to - from) * fraction });
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    const input = new Uint8Array(req.buffer);

    if (req.type === 'compress') {
      // Phase 1 (0-60%): compress.
      let t = performance.now();
      const packed = compress(input, req.algorithm, progress('Compressing', 'Encoding data…', 0, 60));
      const compressMs = performance.now() - t;

      // Phase 2 (60-100%): decompress the real output and compare it with the input.
      t = performance.now();
      const restored = decompress(packed, progress('Verifying', 'Decompressing to verify round trip…', 60, 100));
      const decompressMs = performance.now() - t;
      const verified = bytesEqual(restored.data, input);

      post(
        {
          type: 'compressed',
          output: packed.buffer as ArrayBuffer,
          originalSize: input.length,
          compressedSize: packed.length,
          compressMs,
          decompressMs,
          verified,
        },
        [packed.buffer as ArrayBuffer],
      );
    } else {
      const t = performance.now();
      const { algorithm, data } = decompress(input, progress('Decompressing', 'Decoding data…', 0, 100));
      const decompressMs = performance.now() - t;
      // decompress() already checked the CRC-32 stored in the header.
      post(
        {
          type: 'decompressed',
          algorithm,
          output: data.buffer as ArrayBuffer,
          originalSize: data.length,
          compressedSize: input.length,
          decompressMs,
        },
        [data.buffer as ArrayBuffer],
      );
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
