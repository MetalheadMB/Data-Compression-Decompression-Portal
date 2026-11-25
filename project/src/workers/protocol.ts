import type { CompressionAlgorithm, ProcessingProgress } from '../types';

export type WorkerRequest =
  | { type: 'compress'; algorithm: CompressionAlgorithm; buffer: ArrayBuffer }
  | { type: 'decompress'; buffer: ArrayBuffer };

export type WorkerResponse =
  | ({ type: 'progress' } & ProcessingProgress)
  | {
      type: 'compressed';
      output: ArrayBuffer;
      originalSize: number;
      compressedSize: number;
      compressMs: number;
      decompressMs: number;
      verified: boolean;
    }
  | {
      type: 'decompressed';
      algorithm: CompressionAlgorithm;
      output: ArrayBuffer;
      originalSize: number;
      compressedSize: number;
      decompressMs: number;
    }
  | { type: 'error'; message: string };

type Done = Exclude<WorkerResponse, { type: 'progress' }>;

/**
 * Starts a fresh worker for one job, forwards its progress messages,
 * and resolves with its final message. The input buffer is transferred, not copied.
 */
export function runInWorker(
  request: WorkerRequest,
  onProgress: (p: ProcessingProgress) => void,
): Promise<Exclude<Done, { type: 'error' }>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./compression.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress({ stage: msg.stage, progress: msg.progress, message: msg.message });
        return;
      }
      worker.terminate();
      if (msg.type === 'error') reject(new Error(msg.message));
      else resolve(msg);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Worker failed'));
    };
    worker.postMessage(request, [request.buffer]);
  });
}
