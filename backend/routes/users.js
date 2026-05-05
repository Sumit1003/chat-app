import express from 'express';
import {
  getUsers,
  searchUsers,
  updateProfile,
  updateAvatar,
  deleteUser,     // admin delete
  deleteSelf,     // self delete
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../config/multer.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar, updateAvatar);  // ← this must exist
router.delete('/me',deleteSelf);     // self delete
router.delete('/:id',admin, deleteUser);   // admin only – we'll add admin check



export default router;