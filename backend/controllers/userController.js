import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all users except current user
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
  res.json(users);
});

// @desc    Search users by name or email
export const searchUsers = asyncHandler(async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } },
    ],
  }).select('-password');
  res.json(users);
});

// @desc    Update user profile (name, password)
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    token: generateToken(updatedUser._id),
  });
});

// @desc    Upload avatar
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Cloudinary returns the secure URL in req.file.path
  user.avatar = req.file.path;
  await user.save();
  res.json({ avatar: user.avatar });
});

// @desc    Delete user account (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const userToDelete = await User.findById(req.params.id);
  if (!userToDelete) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Prevent deleting yourself via admin route (optional)
  if (userToDelete._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete your own account through admin route. Use /api/users/me instead.' });
  }
  await userToDelete.deleteOne();
  res.json({ message: 'User permanently deleted' });
});

// @desc    Self-delete account
// @route   DELETE /api/users/me
// @access  Private
export const deleteSelf = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.deleteOne();
  if (user.avatar && !user.avatar.includes('default')) {
  const publicId = user.avatar.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(`chat-avatars/${publicId}`);
}
  res.json({ message: 'Your account has been permanently deleted' });
});


