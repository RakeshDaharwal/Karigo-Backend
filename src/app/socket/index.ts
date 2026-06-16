import { type Server } from "socket.io";

import { setIO } from "./io";
import { socketAuthMiddleware } from "./middleware/auth";
import { registerHandlers } from "./registerHandlers";

export const initChatSocket = (io: Server) => {
  setIO(io);
  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerHandlers(socket, io));
};
