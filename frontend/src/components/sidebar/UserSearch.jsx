import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiX, FiUserPlus, FiUser, FiUsers } from 'react-icons/fi';

const UserSearch = ({ onConversationCreated, onCancel }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState({});

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (userId) => {
    setCreating(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await api.post('/conversations', { userId });
      onConversationCreated(data);
      toast.success('Conversation started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    } finally {
      setCreating(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  };

  const SkeletonLoader = () => (
    <div className="space-y-3 p-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ message, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
      {query && (
        <button
          onClick={() => setQuery('')}
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          Clear search
        </button>
      )}
    </motion.div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header with search input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative group">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
              autoFocus
            />
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close search"
          >
            <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
          {query ? `Searching for "${query}"` : 'Type to find users'}
        </p>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <SkeletonLoader key="loading" />
          ) : !query ? (
            <EmptyState key="empty" message="Start typing to search for users" icon={FiUsers} />
          ) : users.length === 0 ? (
            <EmptyState key="no-results" message="No users found" icon={FiUser} />
          ) : (
            <motion.div
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <AnimatePresence>
                {users.map(user => (
                  <motion.div
                    key={user._id}
                    variants={itemVariants}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group cursor-pointer"
                    onClick={() => startConversation(user._id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:shadow-md transition-shadow"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startConversation(user._id);
                      }}
                      disabled={creating[user._id]}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-md transition disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                    >
                      {creating[user._id] ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiUserPlus className="w-3 h-3" />
                      )}
                      <span>Chat</span>
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
};

export default UserSearch;