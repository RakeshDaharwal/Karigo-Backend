import { type Server, type Socket } from "socket.io";

import { chatRoom } from "../rooms";
import { SOCKET_EVENTS, type TypingPayload } from "../events";

// --- typing: pure forward, never persisted ---
export const registerTypingHandler = (socket: Socket, _io: Server) => {
  const userId = socket.data.userId as string;

  socket.on(SOCKET_EVENTS.TYPING_START, (payload: TypingPayload) => {
    if (!payload?.roomId) return;
    socket.to(chatRoom(payload.roomId)).emit(SOCKET_EVENTS.TYPING, {
      roomId: payload.roomId,
      userId,
      typing: true,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload: TypingPayload) => {
    if (!payload?.roomId) return;
    socket.to(chatRoom(payload.roomId)).emit(SOCKET_EVENTS.TYPING, {
      roomId: payload.roomId,
      userId,
      typing: false,
    });
  });
};
