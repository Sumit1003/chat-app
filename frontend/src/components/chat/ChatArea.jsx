// frontend/src/components/chat/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { FiMoreVertical } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatArea = ({ conversation, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { socket, onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [pinning, setPinning] = useState(false);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages();
      socket?.emit('join_conversation', conversation._id);
      socket?.emit('mark_as_seen', {
        conversationId: conversation._id,
        userId: currentUser._id,
      });
    }
    return () => {
      if (conversation) {
        socket?.emit('leave_conversation', conversation._id);
      }
    };
  }, [conversation]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      if (data.conversationId === conversation?._id) {
        setMessages(prev => [...prev, data.message]);
        socket.emit('mark_as_seen', {
          conversationId: conversation._id,
          userId: currentUser._id,
        });
      }
    };

    const handleUserTyping = ({ userId, conversationId, isTyping }) => {
      if (conversationId === conversation?._id && userId !== currentUser._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) newSet.add(userId);
          else newSet.delete(userId);
          return newSet;
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, conversation, currentUser]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${conversation._id}`);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages', error);
      toast.error('Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages? This action cannot be undone.')) return;
    try {
      await api.delete(`conversations/${conversation._id}/clear-for-me`);
      setMessages([]);
      toast.success('Chat cleared');
      setShowChatMenu(false);
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  // ✅ ADDED missing function for pin/unpin
  const handleTogglePin = async () => {
    setPinning(true);
    try {
      await api.put(`/conversations/${conversation._id}/pin`);
      const isPinned = conversation.userStates?.find(s => s.userId === currentUser._id)?.pinned;
      toast.success(isPinned ? 'Unpinned' : 'Pinned');
      setShowChatMenu(false);
    } catch (error) {
      toast.error('Failed to pin conversation');
    } finally {
      setPinning(false);
    }
  };

  const handleMessageDelete = (messageId) => {
    setMessages(prev => prev.filter(m => m._id !== messageId));
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Welcome to ChatApp
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Select a conversation or start a new chat from the sidebar
          </p>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(
    p => p._id !== currentUser._id
  );
  const isOnline = onlineUsers.has(otherParticipant?._id);
  const lastSeenFormatted = otherParticipant?.lastSeen
    ? formatDistanceToNow(new Date(otherParticipant.lastSeen), { addSuffix: true })
    : 'recently';

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-3 md:p-4">
          {/* Left side: avatar + name with responsive left padding to avoid menu button */}
          <div className="flex items-center gap-3 pl-12 md:pl-0">
            <div className="relative">
              <img
                src={otherParticipant?.avatar}
                alt={otherParticipant?.name}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white text-base md:text-lg">
                {otherParticipant?.name}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? 'Online' : `Last seen ${lastSeenFormatted}`}
              </p>
            </div>
          </div>

          {/* Right side: three-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Chat menu"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            {showChatMenu && (
              <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-20 min-w-[160px] border border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleTogglePin}
                  disabled={pinning}
                  className="flex items-center gap-2 px-4 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {conversation.userStates?.find(s => s.userId === currentUser._id)?.pinned ? '📌 Unpin' : '📍 Pin'} conversation
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  🗑️ Clear chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUser._id}
            onMessageDelete={handleMessageDelete}
          />
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-2 md:px-4 pb-1">
          <TypingIndicator users={Array.from(typingUsers)} />
        </div>
      )}

      {/* Message input */}
      <div className="sticky bottom-0 w-full bg-gray-50 dark:bg-gray-900">
        <MessageInput
          conversationId={conversation._id}
          receiverId={otherParticipant._id}
          onSendMessage={(newMessage) => {
            setMessages(prev => [...prev, newMessage]);
          }}
        />
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;