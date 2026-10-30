import { defineQuery, useQueryCache } from "@pinia/colada";
import { computed } from "vue";
import { toPatchUserRequest, toUser } from "@/api/adapters/user";
import { getGetUserQueryKey, useGetUser, usePatchUser } from "@/api/generated/endpoints/user/user";
import type { PatchUserRequest } from "@/api/generated/models";

export const useCurrentUser = defineQuery(() => {
  const query = useGetUser();

  const user = computed(() => (query.data.value ? toUser(query.data.value) : undefined));

  return { ...query, user };
});

export function useUpdateCurrentUser() {
  const cache = useQueryCache();
  const mutation = usePatchUser({
    mutation: {
      onSuccess: () => cache.invalidateQueries({ key: getGetUserQueryKey(), exact: true }),
    },
  });

  return {
    ...mutation,
    mutate: (request: PatchUserRequest) => mutation.mutate({ patchUserRequest: toPatchUserRequest(request) }),
    mutateAsync: (request: PatchUserRequest) => mutation.mutateAsync({ patchUserRequest: toPatchUserRequest(request) }),
  };
}
