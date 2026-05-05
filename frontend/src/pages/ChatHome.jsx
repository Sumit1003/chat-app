import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChatHome = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Load saved conversation from localStorage on mount
  useEffect(() => {
    if (!user) {
      setLoadingConversation(false);
      return;
    }
    const savedConvId = localStorage.getItem('selectedConversationId');
    if (savedConvId) {
      api.get(`/conversations/${savedConvId}`)
        .then(({ data }) => {
          setSelectedConversation(data);
        })
        .catch((err) => {
          console.error('Failed to load saved conversation:', err);
          localStorage.removeItem('selectedConversationId');
        })
        .finally(() => setLoadingConversation(false));
    } else {
      setLoadingConversation(false);
    }
  }, [user]);

  // Save conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (selectedConversation?._id) {
      localStorage.setItem('selectedConversationId', selectedConversation._id);
    } else {
      localStorage.removeItem('selectedConversationId');
    }
  }, [selectedConversation]);

  // Join/leave socket rooms
  useEffect(() => {
    if (selectedConversation && socket) {
      socket.emit('join_conversation', selectedConversation._id);
      return () => {
        socket.emit('leave_conversation', selectedConversation._id);
      };
    }
  }, [selectedConversation, socket]);

  if (loadingConversation) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex overflow-hidden"
    >
      <Sidebar
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <ChatArea
        conversation={selectedConversation}
        currentUser={user}
      />
    </motion.div>
  );
};

export default ChatHome;