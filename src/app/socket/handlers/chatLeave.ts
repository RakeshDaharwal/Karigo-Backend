import { type Server, type Socket } from "socket.io";

import { chatRoom } from "../rooms";
import { SOCKET_EVENTS, type ChatLeavePayload } from "../events";

const callAck = (cb: unknown, res: unknown) => {
  if (typeof cb === "function") (cb as (r: unknown) => void)(res);
};

export const registerChatLeaveHandler = (socket: Socket, _io: Server) => {
  const userId = socket.data.userId as string;

  socket.on(
    SOCKET_EVENTS.CHAT_LEAVE,
    async (payload: ChatLeavePayload, cb: unknown) => {
      if (!payload?.roomId) return;
      const room = chatRoom(payload.roomId);
      socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        roomId: payload.roomId,
        userId,
        online: false,
      });
      await socket.leave(room);
      callAck(cb, { ok: true });
    }
  );
};
