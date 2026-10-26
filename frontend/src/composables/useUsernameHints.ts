import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useGetMemberUsernamesStartingWith } from "@/api/generated/endpoints/organizations/organizations";
import { useGetUsernamesStartingWith } from "@/api/generated/endpoints/user/user";
import { useDefaultQueryEnabled } from "./useDefaultQueryEnabled";

/**
 * useUsernameHints resolves usernames starting with a substring.
 *
 * @param search - username prefix
 * @param organizationId - organization id. If provided, only member usernames are considered
 * @returns an array of username starting with search and helpers.
 */
export function useUsernameHints(
  search: MaybeRefOrGetter<string>,
  organizationId?: MaybeRefOrGetter<number | undefined>,
) {
  const defaultEnabled = useDefaultQueryEnabled();
  const enabled = () => defaultEnabled() && toValue(search).length >= 2;
  const params = () => ({ startsWith: toValue(search) });

  const global = useGetUsernamesStartingWith(params, () => ({
    query: { enabled: enabled() && toValue(organizationId) === undefined },
  }));
  const members = useGetMemberUsernamesStartingWith(
    () => toValue(organizationId) ?? 0,
    params,
    () => ({
      query: { enabled: enabled() && (toValue(organizationId) ?? 0) > 0 },
    }),
  );
  const current = () => (toValue(organizationId) === undefined ? global : members);

  return {
    usernames: computed(() => (enabled() ? (current().data.value ?? []) : [])),
    error: computed(() => (enabled() ? current().error.value : null)),
    isLoading: computed(() => enabled() && current().isLoading.value),
    retry: () => (enabled() ? current().refetch() : Promise.resolve()),
  };
}
