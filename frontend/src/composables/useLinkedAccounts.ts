import { defineQuery, useQueryCache } from "@pinia/colada";
import { useLinkAccount, useUnlinkAccount } from "@/api/generated/endpoints/integrations/integrations";
import { getGetMessengerAccountsQueryKey, useGetMessengerAccounts } from "@/api/generated/endpoints/user/user";
import { useTokenStore } from "@/stores/TokenStore";

export const linkedAccountsKey = (sessionVersion: number) =>
  [...getGetMessengerAccountsQueryKey(), sessionVersion] as const;

export const useLinkedAccounts = defineQuery(() => {
  const tokens = useTokenStore();
  return useGetMessengerAccounts(() => ({
    query: { key: linkedAccountsKey(tokens.sessionVersion) },
  }));
});

export function useLinkMessengerAccount() {
  const cache = useQueryCache();
  return useLinkAccount({
    mutation: {
      onSuccess: (_data, _request, { sessionVersion }) =>
        cache.invalidateQueries({ key: linkedAccountsKey(sessionVersion), exact: true }),
    },
  });
}

export function useUnlinkMessengerAccount() {
  const cache = useQueryCache();
  return useUnlinkAccount({
    mutation: {
      onSuccess: (_data, _request, { sessionVersion }) =>
        cache.invalidateQueries({ key: linkedAccountsKey(sessionVersion), exact: true }),
    },
  });
}
