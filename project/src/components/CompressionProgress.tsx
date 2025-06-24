import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface CompressionProgressProps {
  progress: ProcessingProgress;
  isComplete: boolean;
  hasError: boolean;
}

export function CompressionProgress({ progress, isComplete, hasError }: CompressionProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        {hasError ? (
          <AlertCircle className="h-6 w-6 text-red-500" />
        ) : isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        )}
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {hasError ? 'Error' : isComplete ? 'Complete' : progress.stage}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progress.message}
          </p>
        </div>
      </div>
      
      {!hasError && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}