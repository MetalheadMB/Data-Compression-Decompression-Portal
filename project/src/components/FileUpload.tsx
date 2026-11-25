import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPRESSED_EXTENSION } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number;
}

/**
 * Accepts any file type: the algorithms work on raw bytes, so text, images
 * and binaries all round-trip. A .cmpz file is routed to decompression by App.
 */
export function FileUpload({ onFileSelect, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  const processFile = (file: File) => {
    if (file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)} MB limit`);
      return;
    }
    setError('');
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // allow picking the same file again
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Choose a file"
        />
        <motion.div animate={{ scale: isDragging ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isDragging ? 'Drop your file here' : 'Upload a file'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Drag and drop or click to browse</p>
        <p className="text-xs text-gray-500">Any file type · {COMPRESSED_EXTENSION} files are decompressed</p>
        <p className="text-xs text-gray-500 mt-1">Max size: {(maxSize / (1024 * 1024)).toFixed(0)} MB</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
