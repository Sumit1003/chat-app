import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiMapPin, FiMessageCircle } from 'react-icons/fi'; // Changed FiPin to FiMapPin

const ConversationItem = React.memo(({ conversation, isSelected, onClick, onDelete, onlineUsers, currentUserId }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  const isOnline = onlineUsers.has(otherParticipant?._id);
  const userState = conversation.userStates?.find(state => state.userId === currentUserId);
  const isPinned = userState?.pinned || false;
  const lastMessageText = conversation.lastMessageText || 'No messages yet';
  const lastMessageTime = conversation.lastMessageTime;
  const unreadCount = conversation.unreadCount || 0;

  // Optimized avatar URL
  const avatarUrl = otherParticipant?.avatar?.includes('cloudinary')
    ? `${otherParticipant.avatar}?w=48&h=48&c=fill&q=auto&f=auto`
    : otherParticipant?.avatar;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setTimeout(() => setShowDeleteConfirm(false), 3000);
  };
  const confirmDelete = (e) => { e.stopPropagation(); setShowDeleteConfirm(false); onDelete(); };
  const cancelDelete = (e) => { e.stopPropagation(); setShowDeleteConfirm(false); };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.2 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  const deleteConfirmVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -10 }
  };

  const pinIconVariants = {
    pinned: { rotate: 0, scale: 1 },
    unpinned: { rotate: -45, scale: 0.8 }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      onClick={onClick}
      className={`
        relative flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 group
        ${isSelected 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-500' 
          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-700/50'
        }
      `}
    >
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={otherParticipant?.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm group-hover:shadow-md transition-shadow"
          loading="lazy"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse">
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          </span>
        )}
        {!isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
              {otherParticipant?.name}
            </h3>
            {isPinned && (
              <motion.div variants={pinIconVariants} animate="pinned" initial="unpinned">
                <FiMapPin className="w-3.5 h-3.5 text-yellow-500 rotate-45 fill-yellow-500" />
              </motion.div>
            )}
          </div>
          {lastMessageTime && (
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
          {lastMessageText.startsWith('📷') && <FiMessageCircle className="w-3 h-3 inline" />}
          {lastMessageText}
        </p>
      </div>
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 shadow-md"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.div>
      )}
      <div className="relative">
        {!showDeleteConfirm ? (
          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 transition p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transform hover:scale-110"
            title="Delete conversation"
          >
            <FiTrash2 className="w-4 h-4 text-red-500" />
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              variants={deleteConfirmVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-10 flex gap-2 whitespace-nowrap border"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs">Delete?</span>
              <button onClick={confirmDelete} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Yes</button>
              <button onClick={cancelDelete} className="px-2 py-1 text-xs bg-gray-300 rounded">No</button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

ConversationItem.displayName = 'ConversationItem';
export default ConversationItem;