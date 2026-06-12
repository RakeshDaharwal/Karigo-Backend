import { type Server, type Socket } from "socket.io";
import { ulid } from "ulid";

import { MessageStatus } from "../../generated/prisma/enums";
import {
  ensureRoom,
  getRoomParticipants,
} from "../../repositories/chat.repository";
import { enqueueMessageSave, enqueueRoomSeen } from "../../queues";
import {
  addSocket,
  removeSocket,
  isOnline,
} from "./presence";
import { userRoom, chatRoom } from "./io";
import {
  SOCKET_EVENTS,
  type ChatJoinPayload,
  type ChatJoinResult,
  type ChatLeavePayload,
  type MessageSendPayload,
  type MessageSendAck,
  type MessageSeenPayload,
  type TypingPayload,
} from "./events";
import { logError } from "../../utils/logger.utils";

type Ack<T> = (res: T) => void;

const callAck = <T,>(cb: unknown, res: T) => {
  if (typeof cb === "function") (cb as Ack<T>)(res);
};

const isParticipant = (
  viewerUserId: string,
  room: { userId: string; workerUserId: string }
) => viewerUserId === room.userId || viewerUserId === room.workerUserId;

export const registerChatHandlers = (socket: Socket, io: Server) => {
  const userId = socket.data.userId as string;

  // --- presence: add this socket and let peers in shared rooms know ---
  addSocket(userId, socket.id);
  socket.join(userRoom(userId));
  console.log(`[socket] connected userId=${userId} socketId=${socket.id}`);

  const broadcastPresenceToJoinedRooms = (online: boolean) => {
    for (const room of socket.rooms) {
      if (room.startsWith("room:")) {
        socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          roomId: room.slice("room:".length),
          userId,
          online,
        });
      }
    }
  };

  socket.on(
    SOCKET_EVENTS.CHAT_JOIN,
    async (payload: ChatJoinPayload & { roomId?: string }, cb: unknown) => {
      try {
        let room: { id: string; userId: string; workerUserId: string } | null = null;

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

        socket.join(chatRoom(room.id));
        const peerUserId = userId === room.userId ? room.workerUserId : room.userId;
        console.log(
          `[socket] chat:join userId=${userId} roomId=${room.id} peerUserId=${peerUserId} peerOnline=${isOnline(peerUserId)}`
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
          peerOnline: isOnline(peerUserId),
        });
      } catch (err) {
        logError("chat:join failed", { userId, error: (err as Error)?.message });
        callAck<ChatJoinResult>(cb, { ok: false, error: "join_failed" });
      }
    }
  );

  socket.on(SOCKET_EVENTS.CHAT_LEAVE, (payload: ChatLeavePayload) => {
    if (!payload?.roomId) return;
    const room = chatRoom(payload.roomId);
    socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
      roomId: payload.roomId,
      userId,
      online: false,
    });
    socket.leave(room);
  });

  // --- hot path: no PostgreSQL access, deliver + ack + enqueue ---
  socket.on(
    SOCKET_EVENTS.MESSAGE_SEND,
    (payload: MessageSendPayload, cb: unknown) => {
      const tempId = payload?.tempId ?? "";
      try {
        const content = typeof payload?.content === "string" ? payload.content.trim() : "";
        const roomId = payload?.roomId;
        const receiverId = payload?.receiverId;

        if (!tempId || !roomId || !receiverId || !content) {
          callAck<MessageSendAck>(cb, { ok: false, tempId, error: "invalid_payload" });
          return;
        }
        if (content.length > 4000) {
          callAck<MessageSendAck>(cb, { ok: false, tempId, error: "content_too_long" });
          return;
        }
        // Only members joined to the room may send into it.
        if (!socket.rooms.has(chatRoom(roomId))) {
          callAck<MessageSendAck>(cb, { ok: false, tempId, error: "not_joined" });
          return;
        }

        const id = ulid();
        const createdAt = new Date();
        const message = {
          id,
          roomId,
          senderId: userId,
          receiverId,
          content,
          status: MessageStatus.SENT,
          createdAt: createdAt.toISOString(),
        };

        console.log(
          `[socket] message:send id=${id} roomId=${roomId} senderId=${userId} receiverId=${receiverId} receiverOnline=${isOnline(receiverId)} content="${content}"`
        );

        // Deliver instantly to the receiver (all their devices) and to the
        // sender's OTHER devices. Persistence happens asynchronously below.
        io.to(userRoom(receiverId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
        socket.to(userRoom(userId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

        callAck<MessageSendAck>(cb, {
          ok: true,
          tempId,
          id,
          createdAt: message.createdAt,
          status: MessageStatus.SENT,
        });

        void enqueueMessageSave({
          id,
          roomId,
          senderId: userId,
          receiverId,
          content,
          createdAt: message.createdAt,
        }).catch((err) =>
          logError("enqueue message-save failed", { id, error: err?.message })
        );
      } catch (err) {
        logError("message:send failed", { userId, error: (err as Error)?.message });
        callAck<MessageSendAck>(cb, { ok: false, tempId, error: "send_failed" });
      }
    }
  );

  socket.on(SOCKET_EVENTS.MESSAGE_SEEN, (payload: MessageSeenPayload) => {
    if (!payload?.roomId) return;
    void enqueueRoomSeen(payload.roomId, userId).catch((err) =>
      logError("enqueue room-seen failed", { userId, error: err?.message })
    );
  });

  // --- typing: pure forward, never persisted ---
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

  socket.on("disconnecting", () => {
    const { becameOffline } = removeSocket(userId, socket.id);
    console.log(
      `[socket] disconnect userId=${userId} socketId=${socket.id} becameOffline=${becameOffline}`
    );
    if (becameOffline) broadcastPresenceToJoinedRooms(false);
  });
};
