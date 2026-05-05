import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Request password reset (send token)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if user exists (but never reveal existence for security)
  const user = await User.findOne({ email });
  if (!user) {
    // Return same success message to prevent email enumeration
    return res.status(200).json({
      message: 'If that email exists, a reset link will be sent',
    });
  }

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Build reset URL using frontend origin
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  // In development, return the token and URL for testing
  if (process.env.NODE_ENV !== 'production') {
    return res.status(200).json({
      message: 'Reset token generated (dev mode)',
      resetToken,
      resetUrl,
    });
  }

  // TODO: Integrate nodemailer to send the resetUrl via email
  // Example:
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Password Reset',
  //   html: `<a href="${resetUrl}">Click here to reset your password</a>`
  // });

  res.status(200).json({
    message: 'Password reset link sent to your email',
  });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  // Find user with valid token (not expired)
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  // Set new password (will be hashed automatically by the pre-save hook)
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({
    message: 'Password has been reset. Please login with your new password.',
  });
});