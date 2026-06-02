import { Request, Response, NextFunction } from "express";
import prisma from "../../config/db.conn";

export const getChatRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = user.userId;

    const worker = await prisma.worker.findFirst({ where: { userId } });

    const rooms = await prisma.chatRoom.findMany({
      where: worker
        ? {
            OR: [{ userId }, { workerId: worker.id }],
          }
        : { userId },
      include: {
        user: true,
        worker: {
          include: { user: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    const visibleRooms = rooms.filter(
      (room) => room.userId !== room.worker.userId && room.messages.length > 0
    );

    const formattedRooms = visibleRooms.map((room) => {
      const isUserSide = room.userId === userId;

      const otherPersonName = isUserSide
        ? `${room.worker.user.firstName || ''} ${room.worker.user.lastName || ''}`.trim() || room.worker.mobile
        : `${room.user.firstName || ''} ${room.user.lastName || ''}`.trim() || room.user.mobile;

      const avatar = otherPersonName.substring(0, 2).toUpperCase() || 'U';

      const lastMsg = room.messages.length > 0 ? room.messages[0].content : '';
      const time = room.messages.length > 0 ? room.messages[0].createdAt : room.updatedAt;

      const unreadCount = 0;

      return {
        id: room.id,
        name: otherPersonName,
        lastMsg,
        time,
        unread: unreadCount,
        avatar,
        avatarBg: isUserSide ? '#00A884' : '#0367da',
        workerId: room.workerId,
        workerUserId: room.worker.userId,
      };
    });

    formattedRooms.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Chat rooms fetched successfully",
      data: formattedRooms,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRoomMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rawId = req.params.roomId;
    const roomId =
      typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room id required" });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const workerRow = await prisma.worker.findUnique({
      where: { id: room.workerId },
      select: { userId: true },
    });

    if (!workerRow) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    const participant =
      user.userId === room.userId || user.userId === workerRow.userId;
    if (!participant) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (room.userId === workerRow.userId) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error: any) {
    next(error);
  }
};
