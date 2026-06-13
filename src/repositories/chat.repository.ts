import prisma from "../config/db.conn";
import { ulid } from "ulid";
import { MessageStatus } from "../generated/prisma/enums";
import {
  isClearedAfter,
  isMessageDeleted,
  isRoomSeenAfter,
} from "../app/socket/chatRuntimeState";

export type RoomLite = {
  id: string;
  userId: string;
  workerUserId: string;
};

// Resolves the two participant user ids for a worker-backed room.
export const getWorkerUserId = (workerId: string) =>
  prisma.worker.findUnique({
    where: { id: workerId },
    select: { userId: true },
  });

// Ensures the room exists for a (user, worker) pair. Called once when a chat
// screen opens so the hot message-send path never has to touch PostgreSQL.
export const ensureRoom = async (userId: string, workerId: string) => {
  const room = await prisma.chatRoom.upsert({
    where: { userId_workerId: { userId, workerId } },
    create: { id: ulid(), userId, workerId },
    update: {},
    select: {
      id: true,
      userId: true,
      blockedBy: true,
      worker: { select: { userId: true } },
    },
  });
  return {
    id: room.id,
    userId: room.userId,
    workerUserId: room.worker.userId,
    blockedBy: room.blockedBy,
  };
};

export const getRoomParticipants = async (roomId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      userId: true,
      blockedBy: true,
      worker: { select: { userId: true } },
    },
  });
  if (!room) return null;
  return {
    id: room.id,
    userId: room.userId,
    workerUserId: room.worker.userId,
    blockedBy: room.blockedBy,
  };
};

type PersistMessageInput = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  receiverInRoom?: boolean;
};

// Idempotent persist (safe under BullMQ retries) + denormalized room preview
// + receiver unread increment, in a single transaction.
export const persistMessage = (input: PersistMessageInput) =>
  prisma.$transaction(async (tx) => {
    // Guard against the delete/clear-then-late-save race: a message that was
    // hard-deleted (or whose room was cleared) before its save job ran must not
    // be resurrected.
    if (isMessageDeleted(input.id) || isClearedAfter(input.roomId, input.createdAt)) {
      return { created: false };
    }

    const existing = await tx.chatMessage.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (existing) return { created: false };

    // Only settle as SEEN from the in-memory watermark when the receiver still
    // has this chat open. A past read session must not auto-read new messages
    // after they leave the room (those should become DELIVERED or stay SENT).
    const alreadySeen =
      Boolean(input.receiverInRoom) &&
      isRoomSeenAfter(input.roomId, input.receiverId, input.createdAt);

    await tx.chatMessage.create({
      data: {
        id: input.id,
        roomId: input.roomId,
        senderId: input.senderId,
        receiverId: input.receiverId,
        content: input.content,
        status: alreadySeen ? MessageStatus.SEEN : MessageStatus.SENT,
        seenAt: alreadySeen ? new Date() : null,
        createdAt: input.createdAt,
      },
    });

    const room = await tx.chatRoom.findUnique({
      where: { id: input.roomId },
      select: { userId: true },
    });
    if (!room) return { created: true };

    const receiverIsCustomer = input.receiverId === room.userId;
    const unreadBump = alreadySeen
      ? {}
      : receiverIsCustomer
        ? { userUnreadCount: { increment: 1 } }
        : { workerUnreadCount: { increment: 1 } };

    await tx.chatRoom.update({
      where: { id: input.roomId },
      data: {
        lastMessageId: input.id,
        lastMessageContent: input.content,
        lastMessageSenderId: input.senderId,
        lastMessageAt: input.createdAt,
        ...unreadBump,
        ...(receiverIsCustomer
          ? { userHiddenAt: null }
          : { workerHiddenAt: null }),
      },
    });

    return { created: true };
  });

export const markMessageDelivered = (messageId: string) =>
  prisma.chatMessage.updateMany({
    where: { id: messageId, status: MessageStatus.SENT },
    data: { status: MessageStatus.DELIVERED, deliveredAt: new Date() },
  });

// Marks every still-unseen message addressed to `receiverId` in a room as SEEN
// and clears that side's unread counter. Returns the peer (sender) user id so
// the caller can notify them.
export const markRoomSeen = async (roomId: string, receiverId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { userId: true, worker: { select: { userId: true } } },
  });
  if (!room) return null;

  const receiverIsCustomer = receiverId === room.userId;
  const peerUserId = receiverIsCustomer ? room.worker.userId : room.userId;

  await prisma.$transaction([
    prisma.chatMessage.updateMany({
      where: {
        roomId,
        receiverId,
        status: {
          in: [MessageStatus.PENDING, MessageStatus.SENT, MessageStatus.DELIVERED],
        },
      },
      data: { status: MessageStatus.SEEN, seenAt: new Date() },
    }),
    prisma.chatRoom.update({
      where: { id: roomId },
      data: receiverIsCustomer
        ? { userUnreadCount: 0 }
        : { workerUnreadCount: 0 },
    }),
  ]);

  return { peerUserId };
};

// ---- Mutations: edit / delete / clear / block ----

// Hard-deletes a single message and, when it was the room's newest message,
// recomputes the denormalized room preview from the remaining messages.
// Returns both participant user ids for realtime fan-out, or null when the
// room can't be resolved.
export const deleteMessageById = async (roomId: string, messageId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { userId: true, worker: { select: { userId: true } } },
  });
  if (!room) return null;

  type DeletedMeta = {
    receiverId: string;
    wasUnread: boolean;
    lastMsg: string;
    time: string | null;
    receiverUnread: number;
  };

  const deletedMeta = await prisma.$transaction(async (tx): Promise<DeletedMeta | null> => {
    const message = await tx.chatMessage.findFirst({
      where: { id: messageId, roomId },
      select: { receiverId: true, status: true },
    });
    if (!message) return null;

    const wasUnread = message.status !== MessageStatus.SEEN;
    const receiverIsCustomer = message.receiverId === room.userId;

    await tx.chatMessage.deleteMany({
      where: { id: messageId, roomId },
    });

    const latest = await tx.chatMessage.findFirst({
      where: { roomId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, content: true, senderId: true, createdAt: true },
    });

    const roomRow = await tx.chatRoom.findUnique({
      where: { id: roomId },
      select: { userUnreadCount: true, workerUnreadCount: true },
    });
    if (!roomRow) return null;

    const currentUnread = receiverIsCustomer
      ? roomRow.userUnreadCount
      : roomRow.workerUnreadCount;
    const receiverUnread = wasUnread ? Math.max(0, currentUnread - 1) : currentUnread;

    await tx.chatRoom.update({
      where: { id: roomId },
      data: {
        lastMessageId: latest?.id ?? null,
        lastMessageContent: latest?.content ?? null,
        lastMessageSenderId: latest?.senderId ?? null,
        lastMessageAt: latest?.createdAt ?? null,
        ...(wasUnread
          ? receiverIsCustomer
            ? { userUnreadCount: receiverUnread }
            : { workerUnreadCount: receiverUnread }
          : {}),
      },
    });

    return {
      receiverId: message.receiverId,
      wasUnread,
      lastMsg: latest?.content ?? "",
      time: latest?.createdAt?.toISOString() ?? null,
      receiverUnread,
    };
  });

  if (!deletedMeta) return null;

  return {
    userId: room.userId,
    workerUserId: room.worker.userId,
    ...deletedMeta,
  };
};

// Soft-hide a message for one participant only (delete for me).
export const hideMessageForUser = async (
  roomId: string,
  messageId: string,
  userId: string
) => {
  const message = await prisma.chatMessage.findFirst({
    where: { id: messageId, roomId },
    select: { id: true },
  });
  if (!message) return { ok: false as const, error: "not_found" };

  await prisma.chatMessageHidden.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { id: ulid(), messageId, userId },
    update: {},
  });

  return { ok: true as const };
};

// Hides the entire conversation for one participant (delete chat for me only).
export const hideRoomForViewer = async (roomId: string, viewerUserId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { userId: true, worker: { select: { userId: true } } },
  });
  if (!room) return null;

  const isUserSide = viewerUserId === room.userId;
  const isWorkerSide = viewerUserId === room.worker.userId;
  if (!isUserSide && !isWorkerSide) return null;

  const now = new Date();
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: isUserSide ? { userHiddenAt: now } : { workerHiddenAt: now },
  });

  return { userId: room.userId, workerUserId: room.worker.userId };
};

// Edits a message's content. Only the original sender may edit. Keeps the room
// preview in sync when the edited message is the room's last message.
export const editMessageById = async (
  roomId: string,
  messageId: string,
  senderId: string,
  content: string
) => {
  const message = await prisma.chatMessage.findFirst({
    where: { id: messageId, roomId },
    select: { senderId: true },
  });
  if (!message) return { ok: false as const, error: "not_found" };
  if (message.senderId !== senderId) {
    return { ok: false as const, error: "forbidden" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.update({
      where: { id: messageId },
      data: { content },
    });
    await tx.chatRoom.updateMany({
      where: { id: roomId, lastMessageId: messageId },
      data: { lastMessageContent: content },
    });
  });

  return { ok: true as const };
};

// Hard-deletes every message in a room and resets its preview + unread counters.
export const clearRoomMessages = async (roomId: string) =>
  prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { roomId } }),
    prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        lastMessageId: null,
        lastMessageContent: null,
        lastMessageSenderId: null,
        lastMessageAt: null,
        userUnreadCount: 0,
        workerUnreadCount: 0,
      },
    }),
  ]);

// Sets (or clears, with null) the block owner on a room.
export const setRoomBlockedBy = (roomId: string, blockedBy: string | null) =>
  prisma.chatRoom.update({
    where: { id: roomId },
    data: { blockedBy },
    select: { id: true, blockedBy: true },
  });

export const getRoomMeta = async (roomId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      userId: true,
      blockedBy: true,
      worker: { select: { userId: true } },
    },
  });
  if (!room) return null;
  return {
    id: room.id,
    userId: room.userId,
    workerUserId: room.worker.userId,
    blockedBy: room.blockedBy,
  };
};

// ---- Read paths (used by REST + React Query) ----

export const listRoomsForViewer = async (viewerUserId: string) => {
  const worker = await prisma.worker.findFirst({
    where: { userId: viewerUserId },
    select: { id: true },
  });

  const rooms = await prisma.chatRoom.findMany({
    where: {
      lastMessageId: { not: null },
      OR: worker
        ? [{ userId: viewerUserId }, { workerId: worker.id }]
        : [{ userId: viewerUserId }],
    },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      userId: true,
      workerId: true,
      lastMessageContent: true,
      lastMessageAt: true,
      lastMessageSenderId: true,
      userUnreadCount: true,
      workerUnreadCount: true,
      userHiddenAt: true,
      workerHiddenAt: true,
      blockedBy: true,
      updatedAt: true,
      user: {
        select: { firstName: true, lastName: true, mobile: true, profileImage: true },
      },
      worker: {
        select: {
          userId: true,
          mobile: true,
          profileImage: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return rooms
    .filter((room) => room.userId !== room.worker.userId)
    .filter((room) => {
      const isUserSide = room.userId === viewerUserId;
      const hiddenAt = isUserSide ? room.userHiddenAt : room.workerHiddenAt;
      if (!hiddenAt) return true;
      if (!room.lastMessageAt) return false;
      return room.lastMessageAt.getTime() > hiddenAt.getTime();
    });
};

export type MessagePageParams = {
  roomId: string;
  viewerUserId: string;
  limit: number;
  cursor?: { createdAt: Date; id: string };
};

// Cursor-based, latest-first. Returns up to `limit` rows ordered newest -> oldest,
// plus the cursor for the next (older) page. No OFFSET.
export const getMessagesPage = async ({
  roomId,
  viewerUserId,
  limit,
  cursor,
}: MessagePageParams) => {
  const rows = await prisma.chatMessage.findMany({
    where: {
      roomId,
      hiddenFor: { none: { userId: viewerUserId } },
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}_${last.id}` : null;

  return { items, nextCursor };
};

export const parseCursor = (raw?: string) => {
  if (!raw) return undefined;
  const idx = raw.lastIndexOf("_");
  if (idx === -1) return undefined;
  const createdAt = new Date(raw.slice(0, idx));
  const id = raw.slice(idx + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return undefined;
  return { createdAt, id };
};
