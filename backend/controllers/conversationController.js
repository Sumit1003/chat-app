import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Get or create conversation between two users
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  try {
    const { userId, receiverId } = req.body;

    const currentUserId = req.user._id;
    const targetUserId = userId || receiverId;

    // ✅ VALIDATION
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // ✅ Use ObjectId (CRITICAL FIX)
    const participants = [
      new mongoose.Types.ObjectId(currentUserId),
      new mongoose.Types.ObjectId(targetUserId),
    ];

    // 🔍 Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    });

    // ➕ Create if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        userStates: participants.map((uid) => ({
          userId: uid,
          pinned: false,
          deleted: false,
          lastReadAt: new Date(),
        })),
        lastMessageTime: new Date(),
      });
    }

    // 🔄 Ensure userStates exist (for old data)
    let updated = false;
    for (const uid of participants) {
      if (!conversation.userStates.some(s => s.userId.toString() === uid.toString())) {
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

    // ✅ Populate data
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email avatar onlineStatus lastSeen")
      .populate("lastMessage");

    res.status(200).json(populatedConversation);

  } catch (error) {
    console.error("🔥 Conversation Error:", error); // IMPORTANT
    res.status(500).json({
      message: "Failed to create or retrieve conversation",
      error: error.message,
    });
  }
});


// @desc Get all conversations
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    "userStates.userId": req.user._id,
    "userStates.deleted": false,
  })
    .populate("participants", "name email avatar onlineStatus lastSeen")
    .populate("lastMessage")
    .sort({ "userStates.pinned": -1, lastMessageTime: -1 });

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const userState = conv.userStates.find(
        (state) => state.userId.toString() === req.user._id.toString()
      );

      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: req.user._id },
        status: { $ne: "seen" },
        createdAt: { $gt: userState?.lastReadAt || new Date(0) },
      });

      return { ...conv.toObject(), unreadCount };
    })
  );

  res.json(result);
});


// @desc Get conversation by ID
export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate("participants", "name email avatar onlineStatus lastSeen")
    .populate("lastMessage");

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  res.json(conversation);
});


// @desc Delete conversation (soft)
export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const userState = conversation.userStates.find(
    (state) => state.userId.toString() === req.user._id.toString()
  );

  if (userState) userState.deleted = true;

  await conversation.save();

  res.json({ message: "Conversation removed" });
});


// @desc Clear chat for both users
export const clearChat = asyncHandler(async (req, res) => {
  await Message.deleteMany({ conversationId: req.params.id });

  await Conversation.findByIdAndUpdate(req.params.id, {
    lastMessage: null,
    lastMessageText: "",
  });

  res.json({ message: "Chat cleared permanently" });
});


// @desc Clear chat for self only
export const clearChatForSelf = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  await Message.updateMany(
    { conversationId },
    { $addToSet: { deletedFor: userId } }
  );

  await Conversation.updateOne(
    { _id: conversationId, "userStates.userId": userId },
    { $set: { "userStates.$.lastReadAt": new Date() } }
  );

  res.json({ message: "Chat cleared for you" });
});