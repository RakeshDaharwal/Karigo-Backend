// In-memory online presence. Single source of truth for who is connected.
// Map<userId, Set<socketId>> supports multiple tabs and multiple devices.
// Deliberately NOT persisted to PostgreSQL and NOT stored in Redis: the
// deployment is a single server, so process memory is authoritative and free.

const onlineUsers = new Map<string, Set<string>>();

export const addSocket = (userId: string, socketId: string) => {
  let sockets = onlineUsers.get(userId);
  if (!sockets) {
    sockets = new Set();
    onlineUsers.set(userId, sockets);
  }
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return { becameOnline: wasOffline };
};

export const removeSocket = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return { becameOffline: false };

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return { becameOffline: true };
  }
  return { becameOffline: false };
};

export const isOnline = (userId: string) => {
  const sockets = onlineUsers.get(userId);
  return Boolean(sockets && sockets.size > 0);
};

export const getSocketIds = (userId: string) =>
  Array.from(onlineUsers.get(userId) ?? []);

export const onlineUserCount = () => onlineUsers.size;
