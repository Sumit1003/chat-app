import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIo } from '../config/socket.js';

// @desc    Get messages for a conversation
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const messages = await Message.find({
    conversationId,
    deletedFor: { $ne: req.user._id },
  })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Message.countDocuments({
    conversationId,
    deletedFor: { $ne: req.user._id },
  });

  res.json({
    messages: messages.reverse(),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

// @desc    Send a new message
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, media } = req.body;
  const senderId = req.user._id;

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

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar');

  // Get conversation to find receiver
  const conversation = await Conversation.findById(conversationId);
  const receiverId = conversation.participants.find(
    p => p.toString() !== senderId.toString()
  );
  const io = getIo();

  // Emit to receiver's personal room
  io.to(`user:${receiverId}`).emit('receive_message', {
    message: populatedMessage,
    conversationId,
  });

  // Update message status to delivered
  await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
  populatedMessage.status = 'delivered';

  res.status(201).json(populatedMessage);
});

// @desc    Delete message for self
export const deleteMessageForSelf = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  if (message.senderId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  message.deletedFor.push(req.user._id);
  await message.save();

  res.json({ message: 'Message deleted' });
});

// @desc    Mark messages as seen
export const markMessagesAsSeen = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: req.user._id },
      status: { $ne: 'seen' },
    },
    { status: 'seen' }
  );

  // Update user's last read time
  await Conversation.findOneAndUpdate(
    { _id: conversationId, 'userStates.userId': req.user._id },
    { $set: { 'userStates.$.lastReadAt': new Date() } }
  );

  res.json({ message: 'Messages marked as seen' });
});