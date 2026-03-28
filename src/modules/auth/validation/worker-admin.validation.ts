import { z } from "zod";

export const reviewWorkerRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECT"], {
    message: "status must be approved or reject",
  }),
});

export type ReviewWorkerRequestInput = z.infer<typeof reviewWorkerRequestSchema>;
