import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMessageCircle, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserItem = ({ user, onlineUsers, onClick, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOnline = onlineUsers.has(user._id);
  const isAdmin = currentUser?.role === 'admin';

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    try {
      await api.delete(`/users/${user._id}`);
      toast.success(`User "${user.name}" deleted`);
      if (onDelete) onDelete(user._id);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    // Auto-hide after 3 seconds
    setTimeout(() => setShowDeleteConfirm(false), 3000);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  const deleteConfirmVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -10 }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className="relative flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 group bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700/50"
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <img
          src={user.avatar}
          alt={user.name}
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

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {user.name}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {user.email}
        </p>
      </div>

      {/* Action buttons (admin only) */}
      {isAdmin && (
        <div className="relative">
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transform hover:scale-110"
              title="Delete user permanently"
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
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-10 whitespace-nowrap flex gap-2 items-center border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-gray-600 dark:text-gray-300">Confirm?</span>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Yes
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 transition"
                >
                  No
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Chat icon (non‑admin) or fallback */}
      {!isAdmin && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
          <FiMessageCircle className="w-5 h-5 text-blue-500" />
        </div>
      )}
    </motion.div>
  );
};

export default UserItem;