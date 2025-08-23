import React from "react";
import { motion } from "framer-motion";

interface InlineLoadingBarProps {
  isLoading: boolean;
  progress?: number; // Optional progress percentage (0-100)
  message?: string;
  className?: string;
}

export const InlineLoadingBar: React.FC<InlineLoadingBarProps> = ({
  isLoading,
  progress,
  message = "جاري المعالجة...",
  className = "",
}) => {
  if (!isLoading) return null;

  return (
    <div className={`w-full ${className}`}>
      {/* Loading Message */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{message}</span>
        {progress !== undefined && (
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: progress !== undefined ? `${progress}%` : "100%"
          }}
          transition={{ 
            duration: progress !== undefined ? 0.3 : 2,
            repeat: progress === undefined ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Animated dots for indeterminate progress */}
      {progress === undefined && (
        <div className="flex justify-center mt-2 space-x-1">
          <motion.div
            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-purple-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      )}
    </div>
  );
};
