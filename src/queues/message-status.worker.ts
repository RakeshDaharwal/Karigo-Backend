import { Worker } from "bullmq";

import { bullConnection, QUEUE_NAMES } from "../config/bullmq.conn";
import { applyRoomSeen } from "../app/chat/applyRoomSeen";
import { markMessageDelivered } from "../repositories/chat.repository";
import { MessageStatus } from "../generated/prisma/enums";
import { getIO, userRoom } from "../app/socket/io";
import { SOCKET_EVENTS, type MessageStatusEvent } from "../app/socket/events";
import { logError, logInfo } from "../utils/logger.utils";
import { type MessageStatusJob } from "./index";

const emitToUser = (userId: string, payload: MessageStatusEvent) => {
  getIO().to(userRoom(userId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, payload);
};

export const createMessageStatusWorker = () => {
  const worker = new Worker<MessageStatusJob>(
    QUEUE_NAMES.messageStatusUpdate,
    async (job) => {
      const data = job.data;

      if (data.type === "delivered") {
        const res = await markMessageDelivered(data.messageId);
        if (res.count > 0) {
          emitToUser(data.senderUserId, {
            roomId: data.roomId,
            status: MessageStatus.DELIVERED,
            messageId: data.messageId,
          });
        }
        return;
      }

      await applyRoomSeen(data.roomId, data.receiverId);
    },
    { connection: bullConnection, concurrency: 10 }
  );

  worker.on("failed", (job, err) => {
    logError("message-status job failed", {
      jobId: job?.id,
      type: job?.data?.type,
      attemptsMade: job?.attemptsMade,
      error: err?.message,
    });
  });

  worker.on("ready", () => logInfo("message-status worker ready"));

  return worker;
};
