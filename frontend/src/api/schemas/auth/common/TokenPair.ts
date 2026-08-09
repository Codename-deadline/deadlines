import z from "zod";

export const TokenPairSchema = z.object({
  accessToken: z.jwt(),
  refreshToken: z.jwt(),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;
