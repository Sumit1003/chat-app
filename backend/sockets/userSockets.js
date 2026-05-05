export const userSockets = new Map();

export const setUserSocket = (userId, socketId) => {
  if (socketId) userSockets.set(userId, socketId);
  else userSockets.delete(userId);
};

export const getUserSocket = (userId) => userSockets.get(userId);