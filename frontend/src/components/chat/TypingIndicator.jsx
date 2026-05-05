import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users }) => {
  // users is an array of userIds; you can fetch names if needed
  // For simplicity, we just show "Someone is typing..."
  if (users.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="px-4 py-2"
    >
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 inline-flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300">Typing...</span>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;