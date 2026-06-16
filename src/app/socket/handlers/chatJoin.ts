import { type Server, type Socket } from "socket.io";

import {
  ensureRoom,
  getRoomParticipants,
} from "../../../repositories/chat.repository";
import { setRoomBlock } from "../chatRuntimeState";
import { chatRoom, isUserInRoom } from "../rooms";
import {
  SOCKET_EVENTS,
  type ChatJoinPayload,
  type ChatJoinResult,
} from "../events";
import { logError } from "../../../utils/logger.utils";

type Ack<T> = (res: T) => void;

const callAck = <T,>(cb: unknown, res: T) => {
  if (typeof cb === "function") (cb as Ack<T>)(res);
};

const isParticipant = (
  viewerUserId: string,
  room: { userId: string; workerUserId: string }
) => viewerUserId === room.userId || viewerUserId === room.workerUserId;

export const registerChatJoinHandler = (socket: Socket, _io: Server) => {
  const userId = socket.data.userId as string;

  socket.on(
    SOCKET_EVENTS.CHAT_JOIN,
    async (payload: ChatJoinPayload & { roomId?: string }, cb: unknown) => {
      try {
        let room:
          | { id: string; userId: string; workerUserId: string; blockedBy: string | null }
          | null = null;

        if (payload?.roomId) {
          room = await getRoomParticipants(payload.roomId);
        } else if (payload?.workerId) {
          // Customer opening a chat with a worker; ensure the room exists once.
          room = await ensureRoom(userId, payload.workerId);
        }

        if (!room) {
          callAck<ChatJoinResult>(cb, { ok: false, error: "room_not_found" });
          return;
        }
        if (!isParticipant(userId, room)) {
          callAck<ChatJoinResult>(cb, { ok: false, error: "forbidden" });
          return;
        }

        // Seed the in-memory block cache so the hot message-send path stays
        // DB-free.
        setRoomBlock(room.id, room.blockedBy);

        socket.join(chatRoom(room.id));
        const peerUserId = userId === room.userId ? room.workerUserId : room.userId;

        // Presence is room-scoped: "online" means the peer currently has THIS
        // chat open (joined the room), not merely that their app is connected.
        // Global presence can't be used here because the disconnect broadcast
        // only reaches rooms the leaving socket had joined, so a globally-online
        // peer who never opened this chat would get stuck showing "online".
        const peerOnline = await isUserInRoom(room.id, peerUserId);
        console.log(
          `[socket] chat:join userId=${userId} roomId=${room.id} peerUserId=${peerUserId} peerOnline=${peerOnline}`
        );

        // Tell the peer (if joined) that we are now online in this room.
        socket.to(chatRoom(room.id)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          roomId: room.id,
          userId,
          online: true,
        });

        callAck<ChatJoinResult>(cb, {
          ok: true,
          roomId: room.id,
          peerUserId,
          peerOnline,
          blockedBy: room.blockedBy,
        });
      } catch (err) {
        logError("chat:join failed", { userId, error: (err as Error)?.message });
        callAck<ChatJoinResult>(cb, { ok: false, error: "join_failed" });
      }
    }
  );
};
