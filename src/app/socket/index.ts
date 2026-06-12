import { type Server } from "socket.io";

import { setIO } from "./io";
import { socketAuthMiddleware } from "./socketAuth";
import { registerChatHandlers } from "./chatHandlers";

export const initChatSocket = (io: Server) => {
  setIO(io);
  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerChatHandlers(socket, io));
};
