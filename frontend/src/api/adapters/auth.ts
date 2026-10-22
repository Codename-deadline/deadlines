import type { Ok, PasswordRequired } from "../generated/models";

type OtpVerificationInput = (Omit<Ok, "passwordRequired"> | Omit<PasswordRequired, "passwordRequired">) & {
  passwordRequired?: boolean;
};

export function toOtpVerification(dto: OtpVerificationInput) {
  if (dto.passwordRequired ?? false) {
    if (!("requestId" in dto)) throw new TypeError("Password verification response has no request ID");
    return { passwordRequired: true as const, requestId: dto.requestId };
  }
  if (!("tokenPair" in dto)) throw new TypeError("OTP verification response has no token pair");
  return { passwordRequired: false as const, tokenPair: { ...dto.tokenPair } };
}

export type OtpVerificationModel = ReturnType<typeof toOtpVerification>;
