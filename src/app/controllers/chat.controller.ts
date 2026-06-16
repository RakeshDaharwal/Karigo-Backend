import { Request, Response, NextFunction } from "express";

import prisma from "../../config/db.conn";
import { applyRoomSeen } from "../chat/applyRoomSeen";
import {
  listRoomsForViewer,
  getRoomParticipants,
  getMessagesPage,
  parseCursor,
  deleteMessageById,
  hideMessageForUser,
  hideRoomForViewer,
  editMessageById,
  clearRoomMessages,
  setRoomBlockedBy,
} from "../../repositories/chat.repository";
import { getIO } from "../socket/io";
import { userRoom, chatRoom } from "../socket/rooms";
import {
  markMessageDeleted,
  markRoomCleared,
  setRoomBlock,
} from "../socket/chatRuntimeState";
import {
  SOCKET_EVENTS,
  type MessageDeletedEvent,
  type MessageHiddenEvent,
  type MessageEditedEvent,
  type ChatClearedEvent,
  type ChatBlockUpdateEvent,
} from "../socket/events";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 30;
const MAX_MESSAGE_LENGTH = 4000;

const getViewer = (req: Request) =>
  (req as Request & { user?: { userId: string } }).user;

const getRoomId = (req: Request) => {
  const raw = req.params.roomId;
  return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
};

const getMessageId = (req: Request) => {
  const raw = req.params.messageId;
  return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
};

// Fan a realtime chat event out to every joined socket in the room plus both
// participants' personal rooms (so devices that aren't currently viewing the
// thread still update their conversation list).
const broadcastToRoom = <T>(
  roomId: string,
  participants: { userId: string; workerUserId: string },
  event: string,
  payload: T
) => {
  getIO()
    .to(chatRoom(roomId))
    .to(userRoom(participants.userId))
    .to(userRoom(participants.workerUserId))
    .emit(event, payload);
};

export const getChatRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getViewer(req);
    if (!user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rooms = await listRoomsForViewer(user.userId);

    const data = rooms.map((room) => {
      const isUserSide = room.userId === user.userId;

      const otherPersonName = isUserSide
        ? `${room.worker.user.firstName || ""} ${room.worker.user.lastName || ""}`.trim() ||
          room.worker.mobile
        : `${room.user.firstName || ""} ${room.user.lastName || ""}`.trim() ||
          room.user.mobile;

      const avatar = otherPersonName.substring(0, 2).toUpperCase() || "U";
      const peerAvatar = isUserSide
        ? room.worker.profileImage
        : room.user.profileImage;

      return {
        id: room.id,
        name: otherPersonName,
        lastMsg: room.lastMessageContent ?? "",
        time: room.lastMessageAt ?? room.updatedAt,
        unread: isUserSide ? room.userUnreadCount : room.workerUnreadCount,
        avatar,
        avatarBg: isUserSide ? "#00A884" : "#0367da",
        peerAvatar: peerAvatar ?? null,
        workerId: room.workerId,
        workerUserId: room.worker.userId,
        peerUserId: isUserSide ? room.worker.userId : room.userId,
        blockedBy: room.blockedBy ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Chat rooms fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getViewer(req);
    if (!user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rawId = req.params.roomId;
    const roomId =
      typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room id required" });
    }

    const room = await getRoomParticipants(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }
    if (user.userId !== room.userId && user.userId !== room.workerUserId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

    const cursor = parseCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : undefined
    );

    const { items, nextCursor } = await getMessagesPage({
      roomId,
      viewerUserId: user.userId,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Messages fetched successfully",
      data: {
        // newest-first from DB; reverse so the client renders oldest -> newest.
        messages: [...items].reverse(),
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /rooms/:roomId/seen — reliable HTTP path to persist read receipts and
// zero the viewer's unread counter (socket message:seen is best-effort only).
export const markRoomSeenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;

    const result = await applyRoomSeen(ctx.room.id, ctx.user.userId);
    if (!result) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Room marked as seen",
    });
  } catch (error) {
    next(error);
  }
};

// Resolves the room and authorizes the viewer as a participant. Returns the
// room (with both user ids + block owner) or sends the appropriate error.
const authorizeRoom = async (req: Request, res: Response) => {
  const user = getViewer(req);
  if (!user?.userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  const roomId = getRoomId(req);
  if (!roomId) {
    res.status(400).json({ success: false, message: "Room id required" });
    return null;
  }
  const room = await getRoomParticipants(roomId);
  if (!room) {
    res.status(404).json({ success: false, message: "Chat room not found" });
    return null;
  }
  if (user.userId !== room.userId && user.userId !== room.workerUserId) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return null;
  }
  return { user, room };
};

// DELETE /rooms/:roomId/messages -> hard-delete every message (clear chat).
export const clearChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { room } = ctx;

    // Guard the delete/clear-then-late-save race before wiping the table.
    markRoomCleared(room.id);
    await clearRoomMessages(room.id);

    broadcastToRoom<ChatClearedEvent>(
      room.id,
      room,
      SOCKET_EVENTS.CHAT_CLEARED,
      { roomId: room.id }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Chat cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /rooms/:roomId/messages/:messageId
// ?scope=me       -> hide for requester only (delete for me)
// ?scope=everyone -> hard-delete for both (sender only)
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { user, room } = ctx;

    const messageId = getMessageId(req);
    if (!messageId) {
      return res.status(400).json({ success: false, message: "Message id required" });
    }

    const scope =
      typeof req.query.scope === "string" ? req.query.scope.trim().toLowerCase() : "everyone";

    if (scope === "me") {
      const result = await hideMessageForUser(room.id, messageId, user.userId);
      if (!result.ok) {
        return res.status(404).json({ success: false, message: "Message not found" });
      }

      getIO()
        .to(userRoom(user.userId))
        .emit(SOCKET_EVENTS.MESSAGE_HIDDEN, {
          roomId: room.id,
          messageId,
          userId: user.userId,
        } satisfies MessageHiddenEvent);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Message deleted for you",
      });
    }

    if (scope !== "everyone") {
      return res.status(400).json({ success: false, message: "Invalid scope" });
    }

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, roomId: room.id },
      select: { senderId: true },
    });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (message.senderId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can delete for everyone",
      });
    }

    markMessageDeleted(messageId);
    const deleted = await deleteMessageById(room.id, messageId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    broadcastToRoom<MessageDeletedEvent>(
      room.id,
      room,
      SOCKET_EVENTS.MESSAGE_DELETED,
      {
        roomId: room.id,
        messageId,
        receiverId: deleted.receiverId,
        wasUnread: deleted.wasUnread,
        lastMsg: deleted.lastMsg,
        time: deleted.time,
        receiverUnread: deleted.receiverUnread,
      }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Message deleted for everyone",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /rooms/:roomId -> hide conversation for requester only.
export const hideChatRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { user, room } = ctx;

    const participants = await hideRoomForViewer(room.id, user.userId);
    if (!participants) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Chat deleted for you",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /rooms/:roomId/messages/:messageId -> edit message content (sender only).
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { user, room } = ctx;

    const messageId = getMessageId(req);
    if (!messageId) {
      return res.status(400).json({ success: false, message: "Message id required" });
    }

    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) {
      return res.status(400).json({ success: false, message: "Content required" });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: "Content too long" });
    }

    const result = await editMessageById(room.id, messageId, user.userId, content);
    if (!result.ok) {
      const status = result.error === "forbidden" ? 403 : 404;
      return res
        .status(status)
        .json({ success: false, message: result.error === "forbidden" ? "Forbidden" : "Message not found" });
    }

    broadcastToRoom<MessageEditedEvent>(
      room.id,
      room,
      SOCKET_EVENTS.MESSAGE_EDITED,
      { roomId: room.id, messageId, content }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Message edited successfully",
      data: { content },
    });
  } catch (error) {
    next(error);
  }
};

// POST /rooms/:roomId/block -> block the conversation (viewer becomes owner).
export const blockChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { user, room } = ctx;

    await setRoomBlockedBy(room.id, user.userId);
    setRoomBlock(room.id, user.userId);

    broadcastToRoom<ChatBlockUpdateEvent>(
      room.id,
      room,
      SOCKET_EVENTS.CHAT_BLOCK_UPDATE,
      { roomId: room.id, blockedBy: user.userId }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Contact blocked",
      data: { blockedBy: user.userId },
    });
  } catch (error) {
    next(error);
  }
};

// POST /rooms/:roomId/unblock -> only the participant who blocked may unblock.
export const unblockChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ctx = await authorizeRoom(req, res);
    if (!ctx) return;
    const { user, room } = ctx;

    if (room.blockedBy && room.blockedBy !== user.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Only the blocker can unblock" });
    }

    await setRoomBlockedBy(room.id, null);
    setRoomBlock(room.id, null);

    broadcastToRoom<ChatBlockUpdateEvent>(
      room.id,
      room,
      SOCKET_EVENTS.CHAT_BLOCK_UPDATE,
      { roomId: room.id, blockedBy: null }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Contact unblocked",
      data: { blockedBy: null },
    });
  } catch (error) {
    next(error);
  }
};
