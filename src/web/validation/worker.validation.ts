import { z } from "zod";

export const reviewWorkerRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECT"], {
    message: "status must be approved or reject",
  }),
});

export type ReviewWorkerRequestInput = z.infer<typeof reviewWorkerRequestSchema>;

export const listWorkersQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    message: "status must be PENDING, APPROVED or REJECTED",
  }),
  search: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string().max(120).optional()
    )
    .optional(),
});

export type ListWorkersQuery = z.infer<typeof listWorkersQuerySchema>;

export const workerIdParamSchema = z.object({
  workerId: z.string().refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Worker id must be a valid id"
  ),
});
