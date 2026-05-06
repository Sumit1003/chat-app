import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiSend, FiImage, FiSmile } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const MessageInput = ({ conversationId, receiverId, onSendMessage }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(typingTimeout);
  }, [typingTimeout]);

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { conversationId, userId: user._id, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      socket.emit('typing', { conversationId, userId: user._id, isTyping: false });
    }, 1000);
    setTypingTimeout(timeout);
  };

  const sendMessage = async (messageText, mediaUrl = null) => {
    if (!messageText.trim() && !mediaUrl) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        conversationId,
        text: messageText,
        media: mediaUrl,
      });
      onSendMessage(data);
      setText('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(text);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await sendMessage('', data.url);
    } catch (error) {
      toast.error('Image upload failed');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
        >
          <FiImage className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <div className="relative" ref={emojiButtonRef}>
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <FiSmile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-10">
              <Suspense fallback={<div className="w-64 h-64 bg-white dark:bg-gray-800 rounded shadow" />}>
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </Suspense>
            </div>
          )}
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-50"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;