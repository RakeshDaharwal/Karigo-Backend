import { Worker } from "bullmq";

import { bullConnection, QUEUE_NAMES } from "../config/bullmq.conn";
import {
  markMessageDelivered,
  markRoomSeen,
} from "../repositories/chat.repository";
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
          // Notify the sender only; their outgoing message was delivered.
          emitToUser(data.senderUserId, {
            roomId: data.roomId,
            status: MessageStatus.DELIVERED,
            messageId: data.messageId,
          });
        }
        return;
      }

      // seen: mark all unseen messages addressed to receiver as SEEN.
      const result = await markRoomSeen(data.roomId, data.receiverId);
      if (result) {
        // Notify the peer (message senders) only. The reader must not receive
        // this event or their own outgoing ticks inflate to SEEN in the UI.
        emitToUser(result.peerUserId, {
          roomId: data.roomId,
          status: MessageStatus.SEEN,
          upToCreatedAt: new Date().toISOString(),
          readByUserId: data.receiverId,
        });
      }
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
