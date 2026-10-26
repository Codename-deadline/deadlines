import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { RefreshTokenRequestSchema } from "./schemas/auth/RefreshTokenRequest";
import { RefreshTokenResponseSchema } from "./schemas/auth/RefreshTokenResponse";
import { type SignInRequest, SignInRequestSchema } from "./schemas/auth/SignInRequest";
import { SignInResponseSchema } from "./schemas/auth/SignInResponse";
import { type SignUpRequest, SignUpRequestSchema } from "./schemas/auth/SignUpRequest";
import { SignUpResponseSchema } from "./schemas/auth/SignUpResponse";
import { type VerifyOtpRequest, VerifyOtpRequestSchema } from "./schemas/auth/VerifyOtpRequest";
import { VerifyOtpResponseSchema } from "./schemas/auth/VerifyOtpResponse";
import { type VerifyPasswordRequest, VerifyPasswordRequestSchema } from "./schemas/auth/VerifyPasswordRequest";
import { VerifyPasswordResponseSchema } from "./schemas/auth/VerifyPasswordResponse";
import { validateAndRequest, validateWith } from "./utils";

export const signUp = (data: SignUpRequest) =>
  validateAndRequest(SignUpRequestSchema, data, (validated) =>
    client.post(getEndpoint("AUTH_SIGN_UP"), validated, {
      validate: validateWith(SignUpResponseSchema),
    }),
  );

export const signIn = async (data: SignInRequest) =>
  validateAndRequest(SignInRequestSchema, data, (validated) =>
    client.post(getEndpoint("AUTH_SIGN_IN"), validated, {
      validate: validateWith(SignInResponseSchema),
    }),
  );

export const verifyOtp = async (data: VerifyOtpRequest) =>
  validateAndRequest(VerifyOtpRequestSchema, data, (validated) =>
    client.post(getEndpoint("AUTH_VERIFY_OTP"), validated, {
      validate: validateWith(VerifyOtpResponseSchema),
    }),
  );

export const verifyPassword = async (data: VerifyPasswordRequest) =>
  validateAndRequest(VerifyPasswordRequestSchema, data, (validated) =>
    client.post(getEndpoint("AUTH_VERIFY_PASSWORD"), validated, {
      validate: validateWith(VerifyPasswordResponseSchema),
    }),
  );

export const refreshToken = async () =>
  validateAndRequest(RefreshTokenRequestSchema, {}, (validated) =>
    client.post(getEndpoint("AUTH_REFRESH_TOKEN"), validated, {
      validate: validateWith(RefreshTokenResponseSchema),
    }),
  );
