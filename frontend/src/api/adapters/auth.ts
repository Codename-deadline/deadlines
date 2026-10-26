import { normalizeTimeZone } from "@/utils/timeZone";
import { normalizeUsername } from "@/utils/validation";
import type {
  ChangePasswordRequest,
  CreateOtpRequest,
  Ok,
  PasswordRequired,
  RegisterOtpRequest,
} from "../generated/models";

export function toCreateOtpRequest(request: CreateOtpRequest): CreateOtpRequest {
  return { ...request, username: normalizeUsername(request.username) };
}

export function toRegisterOtpRequest(request: RegisterOtpRequest): RegisterOtpRequest {
  return { ...request, timeZone: normalizeTimeZone(request.timeZone) };
}

export function toChangePasswordRequest(request: ChangePasswordRequest): ChangePasswordRequest {
  return { ...request, oldPassword: request.oldPassword?.trim() ? request.oldPassword : null };
}

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
