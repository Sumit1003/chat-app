import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationItem from './ConversationItem';
import { FiMessageSquare } from 'react-icons/fi';

const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  onlineUsers, 
  currentUserId,
  onDeleteConversation // optional: function to call when a conversation is deleted
}) => {
  // Sort conversations: pinned first, then by last message time (newest first)
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aUserState = a.userStates?.find(state => state.userId === currentUserId);
      const bUserState = b.userStates?.find(state => state.userId === currentUserId);
      if (aUserState?.pinned && !bUserState?.pinned) return -1;
      if (!aUserState?.pinned && bUserState?.pinned) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
  }, [conversations, currentUserId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  };

  if (sortedConversations.length === 0) {
    return (
      <motion.div
        variants={emptyStateVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-4 shadow-inner"
        >
          <FiMessageSquare className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No conversations
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Click the search button to find users and start a new chat.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
    >
      <AnimatePresence mode="popLayout">
        {sortedConversations.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            isSelected={selectedConversation?._id === conversation._id}
            onClick={() => onSelectConversation(conversation)}
            onDelete={() => onDeleteConversation?.(conversation._id)}
            onlineUsers={onlineUsers}
            currentUserId={currentUserId}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConversationList;