import { z } from "zod";

export const BPLogSchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  systolic: z.string(),
  diastolic: z.string(),
});

export const BPLogResponseSchema = z.object({
  logs: z.array(BPLogSchema),
  error: z.string().optional(),
});

export type BPLogResponse = z.infer<typeof BPLogResponseSchema>;
