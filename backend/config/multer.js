import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// Log Cloudinary config (remove in production)
console.log('Cloudinary config check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✓ set' : '✗ missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✓ set' : '✗ missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✓ set' : '✗ missing',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = file.fieldname === 'avatar' ? 'chat-avatars' : 'chat-messages';
    return {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: [{ width: 1000, crop: 'limit' }],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export const uploadMessageImage = upload.single('image');
export const uploadAvatar = upload.single('avatar');
export default upload;