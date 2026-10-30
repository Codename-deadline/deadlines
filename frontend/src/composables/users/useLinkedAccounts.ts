import { defineQuery, useQueryCache } from "@pinia/colada";
import { useLinkAccount, useUnlinkAccount } from "@/api/generated/endpoints/integrations/integrations";
import { getGetMessengerAccountsQueryKey, useGetMessengerAccounts } from "@/api/generated/endpoints/user/user";

export const useLinkedAccounts = defineQuery(() => useGetMessengerAccounts());

export function useLinkMessengerAccount() {
  const cache = useQueryCache();
  return useLinkAccount({
    mutation: {
      onSuccess: () => cache.invalidateQueries({ key: getGetMessengerAccountsQueryKey(), exact: true }),
    },
  });
}

export function useUnlinkMessengerAccount() {
  const cache = useQueryCache();
  return useUnlinkAccount({
    mutation: {
      onSuccess: () => cache.invalidateQueries({ key: getGetMessengerAccountsQueryKey(), exact: true }),
    },
  });
}
