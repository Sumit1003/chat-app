import express from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessageForSelf,
  markMessagesAsSeen,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { uploadMessageImage } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.delete('/:id', deleteMessageForSelf);
router.put('/seen/:conversationId', markMessagesAsSeen);

// Image upload endpoint with detailed error logging
router.post('/upload', (req, res, next) => {
  uploadMessageImage(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // req.file.path contains the Cloudinary secure URL
  res.json({ url: req.file.path });
});

export default router;