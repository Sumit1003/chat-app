import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MessageBubble = React.memo(({ message, isOwn, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const sender = message.senderId?.name || 'Unknown';
  const text = message.text;
  const media = message.media;
  const timestamp = message.createdAt;
  const status = message.status;

  const handleDeleteForMe = async () => {
    try {
      await api.delete(`/messages/${message._id}`);
      toast.success('Message deleted for you');
      onDelete?.(message._id);
    } catch (error) {
      toast.error('Failed to delete message');
    }
    setShowMenu(false);
  };

  // Optimize image URL if from Cloudinary (add auto format & quality)
  const optimizedMedia = media?.includes('cloudinary')
    ? `${media}?w=400&c=limit&q=auto&f=auto`
    : media;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1 block">
            {sender}
          </span>
        )}
        <div className="relative">
          <div
            className={`
              rounded-2xl px-4 py-2 break-words
              ${isOwn 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
              }
            `}
          >
            {optimizedMedia && (
              <div className="mb-1">
                <img 
                  src={optimizedMedia} 
                  alt="media" 
                  className="max-w-full rounded-lg max-h-60 object-cover"
                  loading="lazy"
                />
              </div>
            )}
            {text && <p className="whitespace-pre-wrap">{text}</p>}
          </div>
          {isOwn && (
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <FiMoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute top-6 left-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-10">
                  <button
                    onClick={handleDeleteForMe}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete for me
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{format(new Date(timestamp), 'p')}</span>
          {isOwn && status && (
            <span>
              {status === 'sent' && '✓'}
              {status === 'delivered' && '✓✓'}
              {status === 'seen' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;