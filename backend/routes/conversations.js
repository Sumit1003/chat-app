import express from 'express';
import {
  getOrCreateConversation,
  getConversations,
  getConversationById,
  deleteConversation,
  clearChat,
  clearChatForSelf,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All conversation routes are protected
router.use(protect);

router.post('/', getOrCreateConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.delete('/:id', deleteConversation);
router.delete('/:id/messages', clearChat);          // hard delete for both users
router.delete('/:id/clear-for-me', clearChatForSelf); // soft delete for current user only

export default router;