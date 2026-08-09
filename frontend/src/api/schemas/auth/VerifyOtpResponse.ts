import z from "zod";
import { TokenPairSchema } from "./common/TokenPair";

const VerifyOtpResponseTokenOrRequestId = z
  .object({
    tokenPair: TokenPairSchema,
    requestId: z.uuidv4(),
  })
  .partial()
  .refine((data) => {
    return data.tokenPair || data.requestId;
  });

export const VerifyOtpResponseSchema = VerifyOtpResponseTokenOrRequestId.safeExtend({
  passwordRequired: z.boolean().default(false),
});

export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;
