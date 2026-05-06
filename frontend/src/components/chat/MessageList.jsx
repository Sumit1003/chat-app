import React, { useRef, useEffect, memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

const MessageList = memo(({ messages, currentUserId, onMessageDelete }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 dark:text-gray-500">No messages yet. Say hi!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {/* initial={false} prevents unnecessary first animation on load */}
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.senderId?._id === currentUserId || message.senderId === currentUserId}
            onDelete={onMessageDelete}
          />
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;