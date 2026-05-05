import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { getIo } from '../config/socket.js';
import { userSockets, setUserSocket, getUserSocket } from './userSockets.js';

const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      onlineStatus: isOnline,
      lastSeen: isOnline ? null : new Date(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

export const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      // Join a personal room
      socket.join(`user:${userId}`);
      updateUserStatus(userId, true);
      socket.broadcast.emit('user_online', userId);
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, userId: typingUserId, isTyping }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: typingUserId,
        conversationId,
        isTyping,
      });
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, media, senderId, receiverId } = data;

        const message = await Message.create({
          conversationId,
          senderId,
          text: text || '',
          media: media || null,
          status: 'sent',
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageText: text || (media ? '📷 Image' : ''),
          lastMessageTime: new Date(),
        });

        const populatedMessage = await Message.findById(message._id).populate(
          'senderId',
          'name avatar'
        );

        const receiverSocketId = getUserSocket(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            message: populatedMessage,
            conversationId,
          });
          await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
          populatedMessage.status = 'delivered';
        }

        // Also send back to sender (for other tabs)
        const senderSocketId = getUserSocket(senderId);
        if (senderSocketId && senderSocketId !== receiverSocketId) {
          io.to(senderSocketId).emit('receive_message', {
            message: populatedMessage,
            conversationId,
          });
        }

        socket.emit('message_sent', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    socket.on('mark_as_seen', async ({ conversationId, userId }) => {
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: userId },
            status: { $ne: 'seen' },
          },
          { status: 'seen' }
        );

        const senders = await Message.find({
          conversationId,
          status: 'seen',
        }).distinct('senderId');

        senders.forEach((senderId) => {
          const senderSocketId = getUserSocket(senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('messages_seen', {
              conversationId,
              userId,
            });
          }
        });
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        setUserSocket(userId, null);
        updateUserStatus(userId, false);
        socket.broadcast.emit('user_offline', userId);
      }
      console.log('User disconnected:', socket.id);
    });
  });
};