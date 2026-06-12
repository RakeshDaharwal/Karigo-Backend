import { Worker } from "bullmq";

import { bullConnection, QUEUE_NAMES } from "../config/bullmq.conn";
import { persistMessage } from "../repositories/chat.repository";
import { isOnline } from "../app/socket/presence";
import { isUserInRoom } from "../app/socket/io";
import {
  enqueueMessageDelivered,
  enqueueRoomSeen,
  type MessageSaveJob,
} from "./index";
import { logError, logInfo } from "../utils/logger.utils";

export const createMessageSaveWorker = () => {
  const worker = new Worker<MessageSaveJob>(
    QUEUE_NAMES.messageSave,
    async (job) => {
      const data = job.data;

      await persistMessage({
        id: data.id,
        roomId: data.roomId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        createdAt: new Date(data.createdAt),
      });

      // Message now exists in PostgreSQL. Decide its status from live presence,
      // independent of queue ordering:
      //   - receiver actively viewing the room -> SEEN (clears unread)
      //   - receiver merely online              -> DELIVERED
      //   - receiver offline                    -> stays SENT
      if (await isUserInRoom(data.roomId, data.receiverId)) {
        await enqueueRoomSeen(data.roomId, data.receiverId);
      } else if (isOnline(data.receiverId)) {
        await enqueueMessageDelivered(data.id, data.roomId, data.senderId);
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
