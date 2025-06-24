import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Repeat, Binary, Info } from 'lucide-react';
import { CompressionAlgorithm, AlgorithmInfo } from '../types';

interface AlgorithmSelectorProps {
  selectedAlgorithm: CompressionAlgorithm;
  onAlgorithmChange: (algorithm: CompressionAlgorithm) => void;
}

const algorithmInfo: Record<CompressionAlgorithm, AlgorithmInfo> = {
  huffman: {
    name: 'Huffman Coding',
    description: 'Uses variable-length codes for characters based on frequency. More frequent characters get shorter codes.',
    complexity: 'O(n log n)',
    bestFor: ['Text files', 'Source code', 'Natural language'],
    worstFor: ['Random data', 'Already compressed files', 'Binary data']
  },
  rle: {
    name: 'Run-Length Encoding',
    description: 'Replaces consecutive identical characters with a count and the character.',
    complexity: 'O(n)',
    bestFor: ['Images with large areas of same color', 'Simple graphics', 'Repetitive data'],
    worstFor: ['Text with no repetition', 'Random data', 'Complex images']
  },
  lz77: {
    name: 'LZ77',
    description: 'Replaces repeated substrings with references to previous occurrences.',
    complexity: 'O(n²)',
    bestFor: ['General text', 'Documents', 'Mixed content'],
    worstFor: ['Very short files', 'Completely random data']
  }
};

const algorithmIcons: Record<CompressionAlgorithm, React.ReactNode> = {
  huffman: <Zap className="h-5 w-5" />,
  rle: <Repeat className="h-5 w-5" />,
  lz77: <Binary className="h-5 w-5" />
};

export function AlgorithmSelector({ selectedAlgorithm, onAlgorithmChange }: AlgorithmSelectorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
        Choose Compression Algorithm
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(Object.keys(algorithmInfo) as CompressionAlgorithm[]).map((algorithm) => (
          <motion.button
            key={algorithm}
            onClick={() => onAlgorithmChange(algorithm)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${selectedAlgorithm === algorithm
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`
                p-2 rounded-lg
                ${selectedAlgorithm === algorithm
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {algorithmIcons[algorithm]}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {algorithmInfo[algorithm].name}
              </h4>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {algorithmInfo[algorithm].description}
            </p>
            
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Complexity: {algorithmInfo[algorithm].complexity}
            </div>
            
            {selectedAlgorithm === algorithm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-2"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      
      {/* Algorithm Details */}
      <motion.div
        key={selectedAlgorithm}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Info className="h-5 w-5 text-blue-500" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {algorithmInfo[selectedAlgorithm].name} Details
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">Best For:</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {algorithmInfo[selectedAlgorithm].bestFor.map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-red-700 dark:text-red-400 mb-2">Not Ideal For:</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {algorithmInfo[selectedAlgorithm].worstFor.map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}