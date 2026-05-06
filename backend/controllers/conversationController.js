// controllers/conversationController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get or create conversation between two users
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId, receiverId } = req.body;
  const currentUserId = req.user._id.toString();
  const targetUserId = (userId || receiverId).toString();

  if (!targetUserId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: 'Cannot chat with yourself' });
  }

  // Sort participants to guarantee consistent order
  const participants = [currentUserId, targetUserId].sort();

  // Try to find existing conversation (using sorted array)
  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants,
        userStates: participants.map(uid => ({
          userId: uid,
          pinned: false,
          deleted: false,
          lastReadAt: new Date(),
        })),
        lastMessageTime: new Date(),
      });
    } catch (error) {
      // Duplicate key (E11000) – race condition, fetch existing conversation
      if (error.code === 11000) {
        conversation = await Conversation.findOne({
          participants: { $all: participants, $size: 2 },
        });
        if (!conversation) throw new Error('Failed to create or retrieve conversation');
      } else {
        throw error;
      }
    }
  } else {
    // Ensure userStates exist for both participants (migration)
    let updated = false;
    for (const uid of participants) {
      if (!conversation.userStates.some(s => s.userId.toString() === uid)) {
        conversation.userStates.push({
          userId: uid,
          pinned: false,
          deleted: false,
          lastReadAt: new Date(),
        });
        updated = true;
      }
    }
    if (updated) await conversation.save();
  }

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate('participants', 'name email avatar onlineStatus lastSeen')
    .populate('lastMessage');

  res.json(populatedConversation);
});

// @desc    Get all conversations for current user (excluding soft-deleted ones)
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    'userStates.userId': req.user._id,
    'userStates.deleted': false,
  })
    .populate('participants', 'name email avatar onlineStatus lastSeen')
    .populate('lastMessage')
    .sort({ 'userStates.pinned': -1, lastMessageTime: -1 });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const userState = conv.userStates.find(
        (state) => state.userId.toString() === req.user._id.toString()
      );
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: req.user._id },
        status: { $ne: 'seen' },
        createdAt: { $gt: userState?.lastReadAt || new Date(0) },
      });
      return { ...conv.toObject(), unreadCount };
    })
  );
  res.json(conversationsWithUnread);
});

export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', 'name email avatar onlineStatus lastSeen')
    .populate('lastMessage');
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
});


// @desc    Soft delete conversation for current user (removes from list)
export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const userState = conversation.userStates.find(
    (state) => state.userId.toString() === req.user._id.toString()
  );
  if (userState) userState.deleted = true;
  await conversation.save();
  res.json({ message: 'Conversation removed from your list' });
});

// @desc    Hard delete entire chat (all messages for both users) – use with caution
export const clearChat = asyncHandler(async (req, res) => {
  await Message.deleteMany({ conversationId: req.params.id });
  await Conversation.findByIdAndUpdate(req.params.id, {
    lastMessage: null,
    lastMessageText: '',
  });
  res.json({ message: 'Chat cleared permanently for both users' });
});

// @desc    Soft delete all messages for current user only (hide them)
export const clearChatForSelf = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  // Mark all messages in this conversation as deleted for this user
  await Message.updateMany(
    { conversationId },
    { $addToSet: { deletedFor: userId } }
  );

  // Update user's lastReadAt (no need to alter global lastMessageText)
  await Conversation.updateOne(
    { _id: conversationId, 'userStates.userId': userId },
    { $set: { 'userStates.$.lastReadAt': new Date() } }
  );

  res.json({ message: 'Chat cleared for you (messages hidden)' });
});