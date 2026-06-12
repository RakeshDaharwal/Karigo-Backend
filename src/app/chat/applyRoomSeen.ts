import { MessageStatus } from "../../generated/prisma/enums";
import { markRoomSeen } from "../../repositories/chat.repository";
import { markRoomSeenAt } from "../socket/chatRuntimeState";
import { getIO, userRoom } from "../socket/io";
import { SOCKET_EVENTS } from "../socket/events";

// Single authoritative path for persisting "reader opened / read this room":
//   1. record in-memory watermark (late message-save jobs settle as SEEN)
//   2. write seenAt + zero unread in PostgreSQL
//   3. push realtime updates to peer (ticks) and reader (list badge)
export const applyRoomSeen = async (
  roomId: string,
  readerUserId: string,
  at = Date.now()
) => {
  markRoomSeenAt(roomId, readerUserId, at);

  const result = await markRoomSeen(roomId, readerUserId);
  if (!result) return null;

  try {
    const io = getIO();
    io.to(userRoom(result.peerUserId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
      roomId,
      status: MessageStatus.SEEN,
      upToCreatedAt: new Date(at).toISOString(),
      readByUserId: readerUserId,
    });
    io.to(userRoom(readerUserId)).emit(SOCKET_EVENTS.CHAT_ROOM_READ, {
      roomId,
      readerUserId,
    });
  } catch {
    // Socket server not initialized (CLI scripts). DB write above still stands.
  }

  return result;
};
