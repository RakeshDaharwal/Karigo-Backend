import { Worker } from "bullmq";

import { bullConnection, QUEUE_NAMES } from "../config/bullmq.conn";
import { persistMessage, markMessageDelivered } from "../repositories/chat.repository";
import { MessageStatus } from "../generated/prisma/enums";
import { isOnline } from "../app/socket/presence/presence";
import { getIO } from "../app/socket/io";
import { isUserInRoom, userRoom } from "../app/socket/rooms";
import { SOCKET_EVENTS } from "../app/socket/events";
import {
  enqueueRoomSeen,
  type MessageSaveJob,
} from "./index";
import { logError, logInfo } from "../utils/logger.utils";

export const createMessageSaveWorker = () => {
  const worker = new Worker<MessageSaveJob>(
    QUEUE_NAMES.messageSave,
    async (job) => {
      const data = job.data;
      const receiverInRoom = await isUserInRoom(data.roomId, data.receiverId);

      const saved = await persistMessage({
        id: data.id,
        roomId: data.roomId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        createdAt: new Date(data.createdAt),
        receiverInRoom,
      });

      if (!saved?.created) return;

      if (receiverInRoom) {
        await enqueueRoomSeen(data.roomId, data.receiverId);
        return;
      }

      if (!isOnline(data.receiverId)) return;

      const res = await markMessageDelivered(data.id);
      if (res.count > 0) {
        try {
          getIO().to(userRoom(data.senderId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
            roomId: data.roomId,
            status: MessageStatus.DELIVERED,
            messageId: data.id,
          });
        } catch {
          // Socket not ready; DB write above still stands.
        }
      }
    },
    { connection: bullConnection, concurrency: 10 }
  );

  worker.on("failed", (job, err) => {
    logError("message-save job failed", {
      jobId: job?.id,
      messageId: job?.data?.id,
      attemptsMade: job?.attemptsMade,
      error: err?.message,
    });
  });

  worker.on("ready", () => logInfo("message-save worker ready"));

  return worker;
};
