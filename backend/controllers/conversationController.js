import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get or create conversation between two users
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId, receiverId } = req.body;
  const currentUserId = req.user._id.toString();
  const targetUserId = (userId || receiverId)?.toString();

  if (!targetUserId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: 'Cannot chat with yourself' });
  }

  const participants = [currentUserId, targetUserId].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (conversation) {
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
  } else {
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
      if (error.code === 11000) {
        conversation = await Conversation.findOne({
          participants: { $all: participants, $size: 2 },
        });
        if (!conversation) throw new Error('Failed to create or retrieve conversation');
      } else {
        throw error;
      }
    }
  }

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate('participants', 'name email avatar onlineStatus lastSeen')
    .populate('lastMessage');

  res.json(populatedConversation);
});

// ✅ ADD THIS MISSING FUNCTION
export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', 'name email avatar onlineStatus lastSeen')
    .populate('lastMessage');
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  res.json(conversation);
});

// @desc    Get all conversations for current user
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

// @desc    Pin/unpin conversation
export const togglePinConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const userState = conversation.userStates.find(
    (state) => state.userId.toString() === req.user._id.toString()
  );
  if (userState) userState.pinned = !userState.pinned;
  await conversation.save();
  res.json({ pinned: userState?.pinned });
});

// @desc    Soft delete conversation for current user
export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const userState = conversation.userStates.find(
    (state) => state.userId.toString() === req.user._id.toString()
  );
  if (userState) userState.deleted = true;
  await conversation.save();
  res.json({ message: 'Conversation removed' });
});

// @desc    Hard delete all messages (both sides)
export const clearChat = asyncHandler(async (req, res) => {
  await Message.deleteMany({ conversationId: req.params.id });
  await Conversation.findByIdAndUpdate(req.params.id, {
    lastMessage: null,
    lastMessageText: '',
  });
  res.json({ message: 'Chat cleared permanently' });
});

// @desc    Soft delete all messages for current user only
export const clearChatForSelf = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  await Message.updateMany(
    { conversationId },
    { $addToSet: { deletedFor: userId } }
  );

  await Conversation.updateOne(
    { _id: conversationId, 'userStates.userId': userId },
    { $set: { 'userStates.$.lastReadAt': new Date() } }
  );

  res.json({ message: 'Chat cleared for you' });
});