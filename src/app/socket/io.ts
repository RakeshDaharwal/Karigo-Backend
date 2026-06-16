import { type Server } from "socket.io";

// Single shared Socket.IO server reference. Workers (running in-process on the
// single server) use this to push realtime status updates back to clients.
let ioRef: Server | null = null;

export const setIO = (io: Server) => {
  ioRef = io;
};

export const getIO = () => {
  if (!ioRef) throw new Error("Socket.IO server not initialized");
  return ioRef;
};
