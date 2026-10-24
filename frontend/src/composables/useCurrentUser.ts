import { defineQuery, useQueryCache } from "@pinia/colada";
import { computed } from "vue";
import { toPatchUserRequest, toUser } from "@/api/adapters/user";
import { getGetUserQueryKey, useGetUser, usePatchUser } from "@/api/generated/endpoints/user/user";
import type { PatchUserRequest } from "@/api/generated/models";
import { useTokenStore } from "@/stores/TokenStore";

export const currentUserKey = (sessionVersion: number) => [...getGetUserQueryKey(), sessionVersion] as const;

export const useCurrentUser = defineQuery(() => {
  const tokens = useTokenStore();
  const query = useGetUser(() => ({
    query: {
      key: currentUserKey(tokens.sessionVersion),
    },
  }));

  const user = computed(() => (query.data.value ? toUser(query.data.value) : undefined));

  return { ...query, user };
});

export function useUpdateCurrentUser() {
  const cache = useQueryCache();
  const mutation = usePatchUser({
    mutation: {
      onSuccess: (_data, _request, { sessionVersion }) =>
        cache.invalidateQueries({ key: currentUserKey(sessionVersion), exact: true }),
    },
  });

  return {
    ...mutation,
    mutate: (request: PatchUserRequest) => mutation.mutate({ patchUserRequest: toPatchUserRequest(request) }),
    mutateAsync: (request: PatchUserRequest) => mutation.mutateAsync({ patchUserRequest: toPatchUserRequest(request) }),
  };
}
