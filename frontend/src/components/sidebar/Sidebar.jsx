// frontend/src/components/sidebar/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import UserItem from "./UserItem";
import { FiSettings, FiLogOut, FiRefreshCw, FiMenu, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Sidebar = ({ onSelectConversation }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("online");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Close mobile sidebar automatically when resizing to desktop
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setAllUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleStartConversation = async (selectedUser) => {
    try {
      const { data } = await api.post("/conversations", {
        userId: selectedUser._id,
      });
      onSelectConversation(data);
      if (isMobile) setIsMobileOpen(false);
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  const getFilteredUsers = () => {
    if (activeTab === "all") return allUsers;
    const isOnlineTab = activeTab === "online";
    return allUsers.filter((u) =>
      isOnlineTab ? onlineUsers.has(u._id) : !onlineUsers.has(u._id),
    );
  };

  const filteredUsers = getFilteredUsers();
  const onlineCount = allUsers.filter((u) => onlineUsers.has(u._id)).length;
  const offlineCount = allUsers.filter((u) => !onlineUsers.has(u._id)).length;

  const tabs = [
    { id: "online", label: "Online", count: onlineCount },
    { id: "offline", label: "Offline", count: offlineCount },
    { id: "all", label: "All", count: allUsers.length },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Chatify
          </h1>
          <button
            onClick={fetchAllUsers}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Refresh"
          >
            <FiRefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <FiLogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {isMobile && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium transition-colors relative
              ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "online"
                ? "No online users at the moment."
                : activeTab === "offline"
                  ? "No offline users."
                  : "No other users found."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((userItem) => (
              <UserItem
                key={userItem._id}
                user={userItem}
                onlineUsers={onlineUsers}
                onClick={() => handleStartConversation(userItem)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  // Desktop: always visible sidebar
  if (!isMobile) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {sidebarContent}
      </div>
    );
  }

  // Mobile: hamburger button + slide‑out panel
  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg"
        aria-label="Open menu"
      >
        <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 w-full max-w-[80vw] sm:max-w-sm h-full bg-white dark:bg-gray-800 shadow-2xl z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
