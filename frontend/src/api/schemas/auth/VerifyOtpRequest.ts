import z from "zod";

export const VerifyOtpRequestSchema = z.object({
  id: z.uuidv4(),
  code: z.string().min(6).max(6),
});

export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
