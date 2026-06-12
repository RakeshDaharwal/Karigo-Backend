import { Queue } from "bullmq";

import {
  bullConnection,
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
} from "../config/bullmq.conn";

export type MessageSaveJob = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export type MessageStatusJob =
  | { type: "delivered"; messageId: string; roomId: string; senderUserId: string }
  | { type: "seen"; roomId: string; receiverId: string };

export const messageSaveQueue = new Queue<MessageSaveJob>(
  QUEUE_NAMES.messageSave,
  { connection: bullConnection, defaultJobOptions: DEFAULT_JOB_OPTIONS }
);

export const messageStatusQueue = new Queue<MessageStatusJob>(
  QUEUE_NAMES.messageStatusUpdate,
  { connection: bullConnection, defaultJobOptions: DEFAULT_JOB_OPTIONS }
);

export const enqueueMessageSave = (job: MessageSaveJob) =>
  // jobId = message id makes the enqueue itself idempotent.
  messageSaveQueue.add("save", job, { jobId: job.id });

export const enqueueMessageDelivered = (
  messageId: string,
  roomId: string,
  senderUserId: string
) =>
  messageStatusQueue.add(
    "delivered",
    { type: "delivered", messageId, roomId, senderUserId },
    { jobId: `delivered:${messageId}` }
  );

export const enqueueRoomSeen = (roomId: string, receiverId: string) =>
  messageStatusQueue.add("seen", { type: "seen", roomId, receiverId });

export const closeQueues = async () => {
  await Promise.allSettled([messageSaveQueue.close(), messageStatusQueue.close()]);
};
