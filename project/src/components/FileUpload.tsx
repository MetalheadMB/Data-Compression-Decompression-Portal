import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileInfo } from '../types';

interface FileUploadProps {
  onFileSelect: (file: FileInfo) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

export function FileUpload({ onFileSelect, acceptedTypes = [], maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit`;
    }
    
    if (acceptedTypes.length > 0 && !acceptedTypes.some(type => 
      file.type.includes(type) || file.name.toLowerCase().endsWith(type)
    )) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          data: e.target?.result as string | ArrayBuffer
        };
        
        setUploadedFile(fileInfo);
        onFileSelect(fileInfo);
      };
      
      // Read as text for compression algorithms
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError('Failed to read file');
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence>
        {!uploadedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragging 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
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
              accept={acceptedTypes.join(',')}
            />
            
            <motion.div
              animate={{ scale: isDragging ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isDragging ? 'Drop your file here' : 'Upload a file'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop or click to browse
            </p>
            
            {acceptedTypes.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Supported: {acceptedTypes.join(', ')}
              </p>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <File className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadedFile.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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