import z from "zod";

export const VerifyPasswordRequestSchema = z.object({
  id: z.uuidv4(),
  password: z.string().min(1),
});

export type VerifyPasswordRequest = z.infer<typeof VerifyPasswordRequestSchema>;
