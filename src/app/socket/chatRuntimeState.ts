// In-process runtime state shared by the socket layer, the REST controllers and
// the BullMQ workers (all run inside the single server process). Kept out of the
// hot message-send DB path so block checks and delete-resurrection guards stay
// in memory.

// roomId -> userId who blocked the conversation (null entry = explicitly unblocked).
const blockedRooms = new Map<string, string | null>();

export const setRoomBlock = (roomId: string, blockedBy: string | null) => {
  blockedRooms.set(roomId, blockedBy);
};

export const getRoomBlock = (roomId: string) => blockedRooms.get(roomId) ?? null;

export const isRoomBlocked = (roomId: string) => Boolean(getRoomBlock(roomId));

// Message ids that were hard-deleted before their async save job ran. The
// message-save worker skips these so a delete can't be resurrected by a late
// persist.
const deletedMessageIds = new Set<string>();
const DELETE_TTL_MS = 10 * 60 * 1000;

export const markMessageDeleted = (messageId: string) => {
  deletedMessageIds.add(messageId);
  setTimeout(() => deletedMessageIds.delete(messageId), DELETE_TTL_MS).unref?.();
};

export const isMessageDeleted = (messageId: string) => deletedMessageIds.has(messageId);

// roomId -> timestamp the room was cleared. A pending save for a message created
// at or before this time is dropped so "clear chat" can't be undone by a late
// persist.
const roomClearedAt = new Map<string, number>();
const CLEAR_TTL_MS = 10 * 60 * 1000;

export const markRoomCleared = (roomId: string) => {
  roomClearedAt.set(roomId, Date.now());
  setTimeout(() => roomClearedAt.delete(roomId), CLEAR_TTL_MS).unref?.();
};

export const isClearedAfter = (roomId: string, createdAt: Date) => {
  const clearedAt = roomClearedAt.get(roomId);
  return clearedAt !== undefined && createdAt.getTime() <= clearedAt;
};

// roomId -> (userId -> timestamp that user last marked the room seen). The
// client emits message:seen the instant a message arrives while the chat is
// open, but persistence runs asynchronously through BullMQ and may complete
// after the receiver has already left the room. Recording the seen time here
// lets persistMessage settle such messages as SEEN (and skip the unread bump)
// instead of leaving a stale unread counter in PostgreSQL.
const roomSeenAt = new Map<string, Map<string, number>>();
const SEEN_TTL_MS = 10 * 60 * 1000;

export const markRoomSeenAt = (roomId: string, userId: string, at: number) => {
  let perUser = roomSeenAt.get(roomId);
  if (!perUser) {
    perUser = new Map();
    roomSeenAt.set(roomId, perUser);
  }
  perUser.set(userId, at);
  setTimeout(() => {
    const map = roomSeenAt.get(roomId);
    if (map?.get(userId) === at) {
      map.delete(userId);
      if (map.size === 0) roomSeenAt.delete(roomId);
    }
  }, SEEN_TTL_MS).unref?.();
};

export const isRoomSeenAfter = (
  roomId: string,
  userId: string,
  createdAt: Date
) => {
  const seenAt = roomSeenAt.get(roomId)?.get(userId);
  return seenAt !== undefined && createdAt.getTime() <= seenAt;
};
