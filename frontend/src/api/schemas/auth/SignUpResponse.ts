import z from "zod";

export const SignUpResponseSchema = z.object({
  otpId: z.uuidv4(),
});

export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;
