import z from "zod";

export const RefreshTokenRequestSchema = z.object();

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
