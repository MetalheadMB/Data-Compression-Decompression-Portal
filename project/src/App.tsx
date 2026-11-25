import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { CompressionProgress } from './components/CompressionProgress';
import { CompressionResults } from './components/CompressionResults';
import { isCompressedFile } from './compression/container';
import { runInWorker } from './workers/protocol';
import { ALGORITHM_NAMES, COMPRESSED_EXTENSION, CompressionAlgorithm, CompressionResult, ProcessingProgress } from './types';

type AppState = 'upload' | 'algorithm' | 'processing' | 'results';
const STEPS: AppState[] = ['upload', 'algorithm', 'processing', 'results'];
const INITIAL_PROGRESS: ProcessingProgress = { stage: 'Starting', progress: 0, message: 'Preparing…' };

function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function originalName(compressedName: string): string {
  return compressedName.toLowerCase().endsWith(COMPRESSED_EXTENSION)
    ? compressedName.slice(0, -COMPRESSED_EXTENSION.length)
    : `${compressedName}.out`;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<CompressionAlgorithm>('huffman');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress>(INITIAL_PROGRESS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fail = (err: unknown) => {
    setErrorMessage(err instanceof Error ? err.message : String(err));
    setProgress({ stage: 'Error', progress: 0, message: err instanceof Error ? err.message : 'Something went wrong' });
  };

  /** Opens a .cmpz file: decompresses it in the worker and checks its CRC-32. */
  const startDecompression = async (file: File, buffer: ArrayBuffer) => {
    setCurrentState('processing');
    setErrorMessage(null);
    setProgress(INITIAL_PROGRESS);
    try {
      const res = await runInWorker({ type: 'decompress', buffer }, setProgress);
      if (res.type !== 'decompressed') throw new Error('Unexpected worker response');
      setResult({
        mode: 'decompress',
        algorithm: res.algorithm,
        fileName: originalName(file.name),
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        compressMs: null,
        decompressMs: res.decompressMs,
        verified: true, // the worker throws if the CRC-32 doesn't match
        output: new Uint8Array(res.output),
      });
      setCurrentState('results');
    } catch (err) {
      fail(err);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (isCompressedFile(head)) {
      await startDecompression(file, await file.arrayBuffer());
    } else {
      setCurrentState('algorithm');
    }
  };

  const startCompression = async () => {
    if (!selectedFile) return;
    setCurrentState('processing');
    setErrorMessage(null);
    setProgress(INITIAL_PROGRESS);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const res = await runInWorker({ type: 'compress', algorithm: selectedAlgorithm, buffer }, setProgress);
      if (res.type !== 'compressed') throw new Error('Unexpected worker response');
      setResult({
        mode: 'compress',
        algorithm: selectedAlgorithm,
        fileName: selectedFile.name + COMPRESSED_EXTENSION,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        compressMs: res.compressMs,
        decompressMs: res.decompressMs,
        verified: res.verified,
        output: new Uint8Array(res.output),
      });
      setCurrentState('results');
    } catch (err) {
      fail(err);
    }
  };

  /** Decompresses the file we just made and downloads the restored original. */
  const handleDownloadDecompressed = async () => {
    if (!result || !selectedFile) return;
    try {
      const res = await runInWorker({ type: 'decompress', buffer: result.output.slice().buffer }, () => {});
      if (res.type !== 'decompressed') throw new Error('Unexpected worker response');
      downloadBytes(new Uint8Array(res.output), selectedFile.name);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const resetApp = () => {
    setCurrentState('upload');
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    setProgress(INITIAL_PROGRESS);
  };

  const stepIndex = STEPS.indexOf(currentState);
  const isDecompressing = result?.mode === 'decompress' || progress.stage === 'Decompressing';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center space-x-4 mb-6">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    stepIndex >= index ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${stepIndex > index ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {currentState === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Upload Your File</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Pick any file to compress it, or upload a <code>{COMPRESSED_EXTENSION}</code> file made here to decompress it.
                  Everything runs in your browser; nothing is uploaded to a server.
                </p>
              </div>
              <FileUpload onFileSelect={handleFileSelect} maxSize={50 * 1024 * 1024} />
            </motion.div>
          )}

          {currentState === 'algorithm' && (
            <motion.div key="algorithm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Algorithm</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">Select the compression algorithm that best suits your file.</p>
              </div>
              <AlgorithmSelector selectedAlgorithm={selectedAlgorithm} onAlgorithmChange={setSelectedAlgorithm} />
              <div className="flex justify-center space-x-4 mt-8">
                <motion.button
                  onClick={resetApp}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={startCompression}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Compression
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentState === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Processing File</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {isDecompressing ? 'Decompressing and checking the CRC-32…' : `Applying ${ALGORITHM_NAMES[selectedAlgorithm]}…`}
                </p>
              </div>
              <CompressionProgress progress={progress} isComplete={false} hasError={errorMessage !== null} />
              {errorMessage !== null && (
                <div className="flex justify-center mt-6">
                  <motion.button
                    onClick={resetApp}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Over
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {currentState === 'results' && result && (
            <motion.div key="results" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {result.mode === 'compress' ? 'Compression Complete' : 'Decompression Complete'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {result.mode === 'compress'
                    ? `Your file was compressed with ${ALGORITHM_NAMES[result.algorithm]} and verified by decompressing it again.`
                    : `This file was made with ${ALGORITHM_NAMES[result.algorithm]}. Its CRC-32 checksum matches the original.`}
                </p>
              </div>

              <CompressionResults
                result={result}
                onDownload={() => downloadBytes(result.output, result.fileName)}
                onDownloadDecompressed={result.mode === 'compress' ? handleDownloadDecompressed : undefined}
              />
              {errorMessage !== null && <p className="text-center text-sm text-red-600">{errorMessage}</p>}

              <div className="flex justify-center mt-8">
                <motion.button
                  onClick={resetApp}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Process Another File
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
