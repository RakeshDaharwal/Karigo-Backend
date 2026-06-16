import { type Server, type Socket } from "socket.io";

import { addSocket } from "./presence/presence";
import { userRoom } from "./rooms";
import { registerChatJoinHandler } from "./handlers/chatJoin";
import { registerChatLeaveHandler } from "./handlers/chatLeave";
import { registerMessageSendHandler } from "./handlers/messageSend";
import { registerMessageSeenHandler } from "./handlers/messageSeen";
import { registerTypingHandler } from "./handlers/typing";
import { registerDisconnectHandler } from "./handlers/disconnect";

export const registerHandlers = (socket: Socket, io: Server) => {
  const userId = socket.data.userId as string;

  // Presence: add this socket and join the per-user room used for fan-out.
  addSocket(userId, socket.id);
  socket.join(userRoom(userId));
  console.log(`[socket] connected userId=${userId} socketId=${socket.id}`);

  registerChatJoinHandler(socket, io);
  registerChatLeaveHandler(socket, io);
  registerMessageSendHandler(socket, io);
  registerMessageSeenHandler(socket, io);
  registerTypingHandler(socket, io);
  registerDisconnectHandler(socket, io);
};
