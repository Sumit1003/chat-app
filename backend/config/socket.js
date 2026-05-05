import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL, credentials: true } });
  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};