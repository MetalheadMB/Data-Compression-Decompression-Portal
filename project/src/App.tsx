import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { CompressionProgress } from './components/CompressionProgress';
import { CompressionResults } from './components/CompressionResults';
import { huffmanCompress, rleCompress, lz77Compress, decompressData } from './utils/compressionAlgorithms';
import { FileInfo, CompressionResult, CompressionAlgorithm, ProcessingProgress } from './types';

type AppState = 'upload' | 'algorithm' | 'processing' | 'results';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('upload');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<CompressionAlgorithm>('huffman');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({
    stage: 'Initializing',
    progress: 0,
    message: 'Preparing compression...'
  });
  const [hasError, setHasError] = useState(false);

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    setCurrentState('algorithm');
  };

  const handleAlgorithmChange = (algorithm: CompressionAlgorithm) => {
    setSelectedAlgorithm(algorithm);
  };

  const startCompression = async () => {
    if (!selectedFile) return;

    setCurrentState('processing');
    setHasError(false);
    
    try {
      const fileData = typeof selectedFile.data === 'string' 
        ? selectedFile.data.includes('base64,') 
          ? atob(selectedFile.data.split(',')[1])
          : selectedFile.data
        : new TextDecoder().decode(selectedFile.data as ArrayBuffer);

      let result: CompressionResult;

      switch (selectedAlgorithm) {
        case 'huffman':
          result = huffmanCompress(fileData, setProcessingProgress);
          break;
        case 'rle':
          result = rleCompress(fileData, setProcessingProgress);
          break;
        case 'lz77':
          result = lz77Compress(fileData, setProcessingProgress);
          break;
        default:
          throw new Error('Unsupported algorithm');
      }

      setCompressionResult(result);
      setCurrentState('results');
    } catch (error) {
      console.error('Compression failed:', error);
      setHasError(true);
      setProcessingProgress({
        stage: 'Error',
        progress: 0,
        message: 'Compression failed. Please try again.'
      });
    }
  };

  const handleDownload = () => {
    if (!compressionResult || !selectedFile) return;

    const blob = new Blob([compressionResult.compressedData as string], {
      type: 'application/octet-stream'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.split('.')[0]}_compressed.dat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDecompress = () => {
    if (!compressionResult) return;

    try {
      const decompressed = decompressData(
        compressionResult.compressedData as string,
        compressionResult.algorithm
      );
      
      const blob = new Blob([decompressed], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile?.name.split('.')[0]}_decompressed.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Decompression failed. This algorithm may not support decompression.');
    }
  };

  const resetApp = () => {
    setCurrentState('upload');
    setSelectedFile(null);
    setCompressionResult(null);
    setHasError(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center space-x-4 mb-6"
          >
            {['upload', 'algorithm', 'processing', 'results'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${(['upload', 'algorithm', 'processing', 'results'].indexOf(currentState) >= index)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${(['upload', 'algorithm', 'processing', 'results'].indexOf(currentState) > index)
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `} />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {currentState === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Upload Your File
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Select a file to compress using advanced algorithms. Supports text files, documents, and various data formats.
                </p>
              </div>
              
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedTypes={['text', '.txt', '.json', '.csv', '.log']}
                maxSize={50 * 1024 * 1024} // 50MB
              />
            </motion.div>
          )}

          {currentState === 'algorithm' && (
            <motion.div
              key="algorithm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Choose Algorithm
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Select the compression algorithm that best suits your file type.
                </p>
              </div>
              
              <AlgorithmSelector
                selectedAlgorithm={selectedAlgorithm}
                onAlgorithmChange={handleAlgorithmChange}
              />
              
              <div className="flex justify-center space-x-4 mt-8">
                <motion.button
                  onClick={() => setCurrentState('upload')}
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
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Processing File
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Applying {selectedAlgorithm.charAt(0).toUpperCase() + selectedAlgorithm.slice(1)} compression...
                </p>
              </div>
              
              <CompressionProgress
                progress={processingProgress}
                isComplete={currentState === 'results'}
                hasError={hasError}
              />
              
              {hasError && (
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

          {currentState === 'results' && compressionResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Compression Complete
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Your file has been processed using {compressionResult.algorithm}.
                </p>
              </div>
              
              <CompressionResults
                result={compressionResult}
                onDownload={handleDownload}
                onDecompress={compressionResult.algorithm !== 'Huffman Coding' ? handleDecompress : undefined}
              />
              
              <div className="flex justify-center mt-8">
                <motion.button
                  onClick={resetApp}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Compress Another File
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