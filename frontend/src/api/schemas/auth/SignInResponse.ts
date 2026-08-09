import z from "zod";

export const SignInResponseSchema = z.object({
  otpId: z.uuidv4(),
});

export type SignInResponse = z.infer<typeof SignInResponseSchema>;
