import type z from "zod";
import { TokenPairSchema } from "./common/TokenPair";

export const RefreshTokenResponseSchema = TokenPairSchema;

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
