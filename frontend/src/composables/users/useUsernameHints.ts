import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useGetMemberUsernamesStartingWith } from "@/api/generated/endpoints/organizations/organizations";
import { useGetUsernamesStartingWith } from "@/api/generated/endpoints/user/user";
import { useDefaultQueryEnabled } from "@/composables/shared/useDefaultQueryEnabled";
import { isOrgIdValid } from "../organizations/useOrganizations";

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
  const isSearchLongEnough = computed(() => {
    return toValue(search).length > 2;
  });

  const globalEnabled = () => defaultEnabled() && isSearchLongEnough && toValue(organizationId) === undefined;
  const membersEnabled = () => defaultEnabled() && isSearchLongEnough && isOrgIdValid(toValue(organizationId) ?? 0);
  const enabled = () => globalEnabled() || membersEnabled();

  const params = () => ({ startsWith: toValue(search) });

  const global = useGetUsernamesStartingWith(params, () => ({
    query: { enabled: globalEnabled() },
  }));
  const members = useGetMemberUsernamesStartingWith(
    () => toValue(organizationId) ?? 0,
    params,
    () => ({
      query: { enabled: membersEnabled() },
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
