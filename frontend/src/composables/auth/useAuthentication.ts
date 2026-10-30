import { toOtpVerification } from "@/api/adapters/auth";
import { useCompletePassword, useVerify } from "@/api/generated/endpoints/authentication/authentication";
import type { TokenPair } from "@/api/generated/models";
import emitter from "@/plugins/emitter";
import type { SessionMutationContext } from "@/plugins/pinia/sessionMutations";
import { useTokenStore } from "@/stores/TokenStore";

function useAuthenticationCompletion() {
  const tokens = useTokenStore();

  return (tokenPair: TokenPair, session: AbortSignal) => {
    // The mutation may replace its own session, but an obsolete attempt cannot replace a newer one.
    session.throwIfAborted();
    tokens.updateTokens(tokenPair);
    emitter.emit("signUpCompleted");
  };
}

export function useOtpVerification(onPasswordRequired: (requestId: string) => void) {
  const complete = useAuthenticationCompletion();

  return useVerify<Error, SessionMutationContext>({
    mutation: {
      meta: { sessionBound: false },
      onSuccess: (dto, _request, { sessionSignal }) => {
        sessionSignal.throwIfAborted();
        const result = toOtpVerification(dto);
        if (result.passwordRequired) onPasswordRequired(result.requestId);
        else complete(result.tokenPair, sessionSignal);
      },
    },
  });
}

export function usePasswordVerification() {
  const complete = useAuthenticationCompletion();

  return useCompletePassword<Error, SessionMutationContext>({
    mutation: {
      meta: { sessionBound: false },
      onSuccess: (tokenPair, _request, { sessionSignal }) => complete(tokenPair, sessionSignal),
    },
  });
}
