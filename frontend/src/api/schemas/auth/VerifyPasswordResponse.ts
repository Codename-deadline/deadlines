import type z from "zod";
import { TokenPairSchema } from "./common/TokenPair";

export const VerifyPasswordResponseSchema = TokenPairSchema;

export type VerifyPasswordResponse = z.infer<typeof VerifyPasswordResponseSchema>;
