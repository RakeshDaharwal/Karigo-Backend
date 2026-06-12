import { Request, Response, NextFunction } from "express";

import {
  listRoomsForViewer,
  getRoomParticipants,
  getMessagesPage,
  parseCursor,
} from "../../repositories/chat.repository";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 30;

const getViewer = (req: Request) =>
  (req as Request & { user?: { userId: string } }).user;

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

      return {
        id: room.id,
        name: otherPersonName,
        lastMsg: room.lastMessageContent ?? "",
        time: room.lastMessageAt ?? room.updatedAt,
        unread: isUserSide ? room.userUnreadCount : room.workerUnreadCount,
        avatar,
        avatarBg: isUserSide ? "#00A884" : "#0367da",
        workerId: room.workerId,
        workerUserId: room.worker.userId,
        peerUserId: isUserSide ? room.worker.userId : room.userId,
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

    const { items, nextCursor } = await getMessagesPage({ roomId, limit, cursor });

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
