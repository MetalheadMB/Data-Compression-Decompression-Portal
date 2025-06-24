import React from 'react';
import { motion } from 'framer-motion';
import { Download, BarChart3, Clock, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { CompressionResult } from '../types';

interface CompressionResultsProps {
  result: CompressionResult;
  onDownload: () => void;
  onDecompress?: () => void;
}

export function CompressionResults({ result, onDownload, onDecompress }: CompressionResultsProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const compressionRatio = result.compressionRatio;
  const isCompressed = compressionRatio > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compression Results
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {result.algorithm} algorithm
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Original</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatFileSize(result.originalSize)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Compressed</span>
            </div>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatFileSize(result.compressedSize)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {isCompressed ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ratio</span>
            </div>
            <p className={`text-lg font-semibold ${
              isCompressed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.abs(compressionRatio).toFixed(1)}%
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</span>
            </div>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {formatTime(result.processingTime)}
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Size Comparison</span>
            <span>{isCompressed ? 'Compressed' : 'Expanded'} by {Math.abs(compressionRatio).toFixed(1)}%</span>
          </div>
          
          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`absolute left-0 top-0 h-full ${
                isCompressed ? 'bg-green-500' : 'bg-red-500'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${100 - Math.abs(compressionRatio)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white mix-blend-difference">
                {formatFileSize(result.compressedSize)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-4 w-4" />
            <span>Download Compressed</span>
          </motion.button>

          {onDecompress && (
            <motion.button
              onClick={onDecompress}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="h-4 w-4" />
              <span>Decompress</span>
            </motion.button>
          )}
        </div>

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Insights</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {isCompressed ? (
              <>
                <p>✅ File size reduced by {compressionRatio.toFixed(1)}%</p>
                <p>⚡ Processing completed in {formatTime(result.processingTime)}</p>
                <p>💾 Space saved: {formatFileSize(result.originalSize - result.compressedSize)}</p>
              </>
            ) : (
              <>
                <p>⚠️ File size increased by {Math.abs(compressionRatio).toFixed(1)}%</p>
                <p>🔍 This file may not be suitable for {result.algorithm}</p>
                <p>💡 Try a different algorithm for better results</p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}