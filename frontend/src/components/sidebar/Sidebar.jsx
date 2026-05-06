import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import ConversationItem from './ConversationItem';
import UserSearch from './UserSearch';
import { FiSettings, FiLogOut, FiSearch, FiMenu, FiX, FiMessageCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Sidebar = ({ selectedConversation, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Remove this chat from your list?')) return;
    try {
      await api.delete(`/conversations/${conversationId}`);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      if (selectedConversation?._id === conversationId) {
        onSelectConversation(null);
      }
      toast.success('Conversation removed');
    } catch (error) {
      toast.error('Failed to remove conversation');
    }
  };

  const handleNewConversation = (newConversation) => {
    setConversations(prev => [newConversation, ...prev]);
    onSelectConversation(newConversation);
    setShowSearch(false);
    if (isMobile) setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Chats</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="New chat"
          >
            <FiSearch className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <FiLogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {isMobile && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content: UserSearch OR Conversation List */}
      {showSearch ? (
        <UserSearch
          onConversationCreated={handleNewConversation}
          onCancel={() => setShowSearch(false)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <FiMessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No conversations yet.</p>
              <button
                onClick={() => setShowSearch(true)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {conversations.map(conv => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  currentUserId={user._id}
                  onlineUsers={onlineUsers}
                  isSelected={selectedConversation?._id === conv._id}
                  onClick={() => onSelectConversation(conv)}
                  onDelete={() => handleDeleteConversation(conv._id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );

  // Desktop
  if (!isMobile) {
    return (
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl z-10"
      >
        {sidebarContent}
      </motion.div>
    );
  }

  // Mobile
  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg"
        aria-label="Open menu"
      >
        <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 left-0 w-full max-w-[85vw] sm:max-w-sm h-full bg-white dark:bg-gray-800 shadow-2xl z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;