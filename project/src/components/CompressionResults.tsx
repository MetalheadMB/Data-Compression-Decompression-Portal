import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Download, BarChart3, Clock, FileText, TrendingDown, TrendingUp, ShieldCheck, ShieldAlert, Gauge } from 'lucide-react';
import { ALGORITHM_NAMES, CompressionResult } from '../types';

interface CompressionResultsProps {
  result: CompressionResult;
  onDownload: () => void;
  onDownloadDecompressed?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Throughput over the uncompressed size, in MB/s (1 MB = 10^6 bytes). */
function formatThroughput(bytes: number, ms: number): string {
  if (bytes === 0 || ms <= 0) return '—';
  const mbPerSec = bytes / 1e6 / (ms / 1000);
  return `${mbPerSec >= 10 ? mbPerSec.toFixed(0) : mbPerSec.toFixed(1)} MB/s`;
}

function Stat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-1 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${accent ?? 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export function CompressionResults({ result, onDownload, onDownloadDecompressed }: CompressionResultsProps) {
  const { originalSize, compressedSize } = result;
  // Measured from the real output file, header included.
  const ratio = compressedSize > 0 ? originalSize / compressedSize : 0;
  const savedPct = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;
  const isSmaller = compressedSize < originalSize;
  const barWidth = originalSize > 0 ? Math.min(100, (compressedSize / originalSize) * 100) : 100;
  const isCompress = result.mode === 'compress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{isCompress ? 'Compression Results' : 'Decompression Results'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ALGORITHM_NAMES[result.algorithm]}</p>
          </div>
        </div>
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            result.verified
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {result.verified ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          <span>{result.verified ? 'Lossless: verified' : 'Round trip failed'}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat icon={<FileText className="h-4 w-4 text-gray-500" />} label="Original" value={formatFileSize(originalSize)} />
          <Stat
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            label="Compressed"
            value={formatFileSize(compressedSize)}
            accent="text-blue-600 dark:text-blue-400"
          />
          <Stat
            icon={isSmaller ? <TrendingDown className="h-4 w-4 text-green-500" /> : <TrendingUp className="h-4 w-4 text-red-500" />}
            label="Ratio"
            value={`${ratio.toFixed(2)}:1`}
            accent={isSmaller ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          />
          <Stat
            icon={<Gauge className="h-4 w-4 text-purple-500" />}
            label={isCompress ? 'Compress speed' : 'Decompress speed'}
            value={formatThroughput(originalSize, isCompress ? result.compressMs ?? 0 : result.decompressMs)}
            accent="text-purple-600 dark:text-purple-400"
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Size comparison</span>
            <span>
              {originalSize === 0 ? 'Empty file' : `${isSmaller ? 'Smaller' : 'Larger'} by ${Math.abs(savedPct).toFixed(1)}%`}
            </span>
          </div>
          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`absolute left-0 top-0 h-full ${isSmaller ? 'bg-green-500' : 'bg-red-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-4 w-4" />
            <span>{isCompress ? 'Download compressed (.cmpz)' : 'Download original file'}</span>
          </motion.button>
          {onDownloadDecompressed && (
            <motion.button
              onClick={onDownloadDecompressed}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="h-4 w-4" />
              <span>Download decompressed</span>
            </motion.button>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {result.compressMs !== null && (
              <p className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Compressed in {formatTime(result.compressMs)} ({formatThroughput(originalSize, result.compressMs)})
              </p>
            )}
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Decompressed in {formatTime(result.decompressMs)} ({formatThroughput(originalSize, result.decompressMs)})
            </p>
            <p>Sizes are measured from the actual output file, including its 14-byte header and code table.</p>
            {isCompress && !isSmaller && originalSize > 0 && (
              <p>This file doesn’t suit {ALGORITHM_NAMES[result.algorithm]}. Try another algorithm.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
