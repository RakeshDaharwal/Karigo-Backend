import { Socket, Server } from "socket.io";
import { ulid } from "ulid";
import prisma from "../../config/db.conn";

type ViewerRole = "USER" | "WORKER";

type EnsureRoomResult =
  | { room: { id: string; userId: string; workerId: string } }
  | { err: string };

const ensureRoomForPair = async (
  customerUserId: string,
  workerRecordId: string
): Promise<EnsureRoomResult> => {
  const uid = String(customerUserId ?? "").trim();
  const wid = String(workerRecordId ?? "").trim();
  if (!uid || !wid) return { err: "missing_user_or_worker" };

  const w = await prisma.worker.findUnique({
    where: { id: wid },
    select: { userId: true },
  });
  if (!w) return { err: "worker_not_found" };
  if (w.userId === uid) return { err: "self_chat_forbidden" };

  const room = await prisma.chatRoom.upsert({
    where: { userId_workerId: { userId: uid, workerId: wid } },
    create: { id: ulid(), userId: uid, workerId: wid },
    update: { workerId: wid },
  });

  return { room };
};

const broadcastPresence = async (io: Server, roomId: string) => {
  const sockets = await io.in(roomId).fetchSockets();
  let userViewers = 0;
  let workerViewers = 0;
  for (const s of sockets) {
    const role = s.data.viewerRole as ViewerRole | undefined;
    if (role === "USER") userViewers += 1;
    else if (role === "WORKER") workerViewers += 1;
  }
  io.to(roomId).emit("presence", {
    customerViewWorkerOnline: workerViewers > 0,
    workerViewCustomerOnline: userViewers > 0,
  });
};

export const handleSocketConnection = (socket: Socket, io: Server) => {
  const ack = (callback: unknown, payload: Record<string, unknown>) => {
    if (typeof callback === "function") {
      (callback as (p: Record<string, unknown>) => void)(payload);
    }
  };

  socket.on("joinRoom", async (data, callback) => {
    try {
      const { userId, workerId, viewerRole } = data ?? {};
      const role: ViewerRole = viewerRole === "WORKER" ? "WORKER" : "USER";

      if (!userId || !workerId) {
        ack(callback, { ok: false, error: "missing_user_or_worker", messages: [] });
        return;
      }

      const ensured = await ensureRoomForPair(userId, workerId);
      if ("err" in ensured) {
        ack(callback, { ok: false, error: ensured.err, messages: [] });
        return;
      }
      const room = ensured.room;

      if (socket.data.prevChatRoomId && socket.data.prevChatRoomId !== room.id) {
        socket.leave(socket.data.prevChatRoomId);
      }

      socket.join(room.id);
      socket.data.prevChatRoomId = room.id;
      socket.data.chatRoomId = room.id;
      socket.data.viewerRole = role;

      const messages = await prisma.chatMessage.findMany({
        where: { roomId: room.id },
        orderBy: { createdAt: "asc" },
      });

      await broadcastPresence(io, room.id);

      ack(callback, { ok: true, roomId: room.id, messages });
    } catch (err) {
      console.error("joinRoom", err);
      ack(callback, { ok: false, error: "join_failed", messages: [] });
    }
  });

  socket.on("sendMessage", async (data, callback) => {
    try {
      const { roomId, userId, workerId, senderId, content } = data ?? {};
      const text = typeof content === "string" ? content.trim() : "";

      if (!senderId || !text) {
        ack(callback, { ok: false, error: "missing_sender_or_content" });
        return;
      }

      let resolvedRoomId = roomId as string | undefined;
      if (!resolvedRoomId && userId && workerId) {
        const ensured = await ensureRoomForPair(userId, workerId);
        if ("err" in ensured) {
          ack(callback, { ok: false, error: ensured.err });
          return;
        }
        resolvedRoomId = ensured.room.id;
      }

      if (!resolvedRoomId) {
        ack(callback, { ok: false, error: "missing_room" });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: resolvedRoomId },
        include: { worker: { select: { userId: true } } },
      });

      if (!room) {
        ack(callback, { ok: false, error: "room_not_found" });
        return;
      }

      if (room.userId === room.worker.userId) {
        ack(callback, { ok: false, error: "self_chat_forbidden" });
        return;
      }

      const workerAccountUserId = room.worker.userId;
      const allowed =
        senderId === room.userId || senderId === workerAccountUserId;
      if (!allowed) {
        ack(callback, { ok: false, error: "forbidden_sender" });
        return;
      }

      socket.join(resolvedRoomId);
      socket.data.chatRoomId = resolvedRoomId;
      if (!socket.data.viewerRole) {
        socket.data.viewerRole =
          senderId === room.userId ? "USER" : "WORKER";
      }

      const msg = await prisma.chatMessage.create({
        data: {
          id: ulid(),
          roomId: resolvedRoomId,
          senderId,
          content: text,
        },
      });

      io.to(resolvedRoomId).emit("newMessage", msg);

      ack(callback, { ok: true, roomId: resolvedRoomId, message: msg });
    } catch (err) {
      console.error("sendMessage", err);
      ack(callback, { ok: false, error: "send_failed" });
    }
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.chatRoomId as string | undefined;
    if (roomId) {
      try {
        await broadcastPresence(io, roomId);
      } catch (e) {
        console.error("presence on disconnect", e);
      }
    }
  });
};
