import { type Server, type Socket } from "socket.io";

import { applyRoomSeen } from "../../chat/applyRoomSeen";
import { SOCKET_EVENTS, type MessageSeenPayload } from "../events";
import { logError } from "../../../utils/logger.utils";

export const registerMessageSeenHandler = (socket: Socket, _io: Server) => {
  const userId = socket.data.userId as string;

  socket.on(SOCKET_EVENTS.MESSAGE_SEEN, async (payload: MessageSeenPayload) => {
    if (!payload?.roomId) return;
    const roomId = payload.roomId;
    try {
      const result = await applyRoomSeen(roomId, userId);
      console.log(
        `[socket] message:seen roomId=${roomId} readerUserId=${userId} cleared=${Boolean(result)}`
      );
    } catch (err) {
      logError("message:seen failed", { userId, roomId, error: (err as Error)?.message });
    }
  });
};
