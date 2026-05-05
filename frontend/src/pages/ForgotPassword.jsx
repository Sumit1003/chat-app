import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiSend, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      if (data.resetUrl) {
        setResetInfo({ url: data.resetUrl, token: data.resetToken });
      } else {
        setResetInfo({ message: data.message });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.1, type: 'spring', damping: 20 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4"
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        {/* Icon & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-3">
            <FiMail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reset Password</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        {!resetInfo ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input with Icon */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <FiMail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                required
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <FiSend className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl">
              {resetInfo.url ? (
                <>
                  <p className="font-semibold mb-2">Reset link ready</p>
                  <p className="text-sm break-all">
                    <a
                      href={resetInfo.url}
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to reset your password
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    (If the link doesn't work, copy the URL: {resetInfo.url})
                  </p>
                </>
              ) : (
                <p>{resetInfo.message}</p>
              )}
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        )}

        {/* Decorative blobs */}
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-blue-400 rounded-full blur-2xl opacity-20 -z-10" />
        <div className="absolute -bottom-2 -left-2 w-28 h-28 bg-purple-400 rounded-full blur-2xl opacity-20 -z-10" />
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;