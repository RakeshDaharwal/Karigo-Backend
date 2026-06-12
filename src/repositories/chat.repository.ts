import prisma from "../config/db.conn";
import { ulid } from "ulid";
import { MessageStatus } from "../generated/prisma/enums";

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
    select: { id: true, userId: true, worker: { select: { userId: true } } },
  });
  return {
    id: room.id,
    userId: room.userId,
    workerUserId: room.worker.userId,
  } satisfies RoomLite;
};

export const getRoomParticipants = async (roomId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true, userId: true, worker: { select: { userId: true } } },
  });
  if (!room) return null;
  return {
    id: room.id,
    userId: room.userId,
    workerUserId: room.worker.userId,
  } satisfies RoomLite;
};

type PersistMessageInput = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
};

// Idempotent persist (safe under BullMQ retries) + denormalized room preview
// + receiver unread increment, in a single transaction.
export const persistMessage = (input: PersistMessageInput) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.chatMessage.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (existing) return;

    await tx.chatMessage.create({
      data: {
        id: input.id,
        roomId: input.roomId,
        senderId: input.senderId,
        receiverId: input.receiverId,
        content: input.content,
        status: MessageStatus.SENT,
        createdAt: input.createdAt,
      },
    });

    const room = await tx.chatRoom.findUnique({
      where: { id: input.roomId },
      select: { userId: true },
    });
    if (!room) return;

    const receiverIsCustomer = input.receiverId === room.userId;

    await tx.chatRoom.update({
      where: { id: input.roomId },
      data: {
        lastMessageId: input.id,
        lastMessageContent: input.content,
        lastMessageSenderId: input.senderId,
        lastMessageAt: input.createdAt,
        ...(receiverIsCustomer
          ? { userUnreadCount: { increment: 1 } }
          : { workerUnreadCount: { increment: 1 } }),
      },
    });
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
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
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

  return rooms.filter((room) => room.userId !== room.worker.userId);
};

export type MessagePageParams = {
  roomId: string;
  limit: number;
  cursor?: { createdAt: Date; id: string };
};

// Cursor-based, latest-first. Returns up to `limit` rows ordered newest -> oldest,
// plus the cursor for the next (older) page. No OFFSET.
export const getMessagesPage = async ({
  roomId,
  limit,
  cursor,
}: MessagePageParams) => {
  const rows = await prisma.chatMessage.findMany({
    where: {
      roomId,
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
