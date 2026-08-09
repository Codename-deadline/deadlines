import z from "zod";
import { AuthMethod } from "@/types/api";

export const SignInRequestSchema = z.object({
  identifier: z.string().min(1).max(255),
  username: z.string().min(1).max(255),
  channel: z.enum(Object.keys(AuthMethod)),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
