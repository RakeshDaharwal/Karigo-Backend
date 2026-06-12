import { createMessageSaveWorker } from "./message-save.worker";
import { createMessageStatusWorker } from "./message-status.worker";

// Workers run in-process on the single server but are isolated here so they can
// be moved to a dedicated worker process later with zero changes to producers.
export const startWorkers = () => {
  const workers = [createMessageSaveWorker(), createMessageStatusWorker()];

  const shutdown = async () => {
    await Promise.allSettled(workers.map((w) => w.close()));
  };

  return { workers, shutdown };
};
