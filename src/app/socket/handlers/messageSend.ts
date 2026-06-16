import { type Server, type Socket } from "socket.io";
import { ulid } from "ulid";

import { MessageStatus } from "../../../generated/prisma/enums";
import { enqueueMessageSave } from "../../../queues";
import { isOnline } from "../presence/presence";
import { isRoomBlocked } from "../chatRuntimeState";
import { userRoom, chatRoom } from "../rooms";
import {
  SOCKET_EVENTS,
  type MessageSendPayload,
  type MessageSendAck,
} from "../events";
import { logError } from "../../../utils/logger.utils";

type Ack<T> = (res: T) => void;

const callAck = <T,>(cb: unknown, res: T) => {
  if (typeof cb === "function") (cb as Ack<T>)(res);
};

export const registerMessageSendHandler = (socket: Socket, io: Server) => {
  const userId = socket.data.userId as string;

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
        // Blocked rooms reject sends from either side (cache seeded on join).
        if (isRoomBlocked(roomId)) {
          callAck<MessageSendAck>(cb, { ok: false, tempId, error: "blocked" });
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
};
