import { useInfiniteQuery, type useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, shallowRef, toValue } from "vue";
import { type OrganizationListModel, toOrganization } from "@/api/adapters/organization";
import { toMember } from "@/api/adapters/user";
import {
  getGetOrganizationMetadataQueryOptions,
  getGetOrganizationsByUserQueryKey,
  getOrganizationsByUser,
  useGetMembers,
  useGetOrganizationMetadata,
} from "@/api/generated/endpoints/organizations/organizations";
import { useTokenStore } from "@/stores/TokenStore";

export const organizationsListPrefix = getGetOrganizationsByUserQueryKey({ page: 0 }).slice(0, -1);
export const organizationsListKey = [...organizationsListPrefix, "infinite"] as const;

function isOrgIdValid(organizationId: MaybeRefOrGetter<number>): boolean {
  return toValue(organizationId) > 0;
}

export function useOrganizations() {
  const tokens = useTokenStore();
  const query = useInfiniteQuery({
    key: organizationsListKey,
    initialPageParam: 0,
    query: ({ pageParam, signal }) => getOrganizationsByUser({ page: pageParam }, { signal }),
    getNextPageParam: (page, _pages, pageParam) => (pageParam + 1 < page.totalPages ? pageParam + 1 : null),
  });

  const nextPageError = shallowRef<unknown>(null);
  const uniqueItems = computed(() => {
    const unique = new Map<number, OrganizationListModel>();
    for (const page of query.data.value?.pages ?? []) {
      for (const dto of page.data) {
        unique.set(dto.id, toOrganization(dto));
      }
    }
    return [...unique.values()];
  });

  const loadMore = async () => {
    if (
      !(tokens.accessToken || tokens.refreshToken) ||
      query.isLoading.value ||
      query.error.value ||
      !query.hasNextPage.value
    )
      return;

    await query.loadNextPage({ cancelRefetch: false });
    nextPageError.value = query.error.value;
  };

  const retry = async () => {
    if (!(tokens.accessToken || tokens.refreshToken) || query.isLoading.value) return;

    if (nextPageError.value && nextPageError.value === query.error.value && query.data.value) {
      await query.loadNextPage({ cancelRefetch: false });
      nextPageError.value = query.error.value;
    } else {
      await query.refetch();
    }
  };

  return { ...query, items: uniqueItems, loadMore, retry };
}

export function useOrganization(organizationId: MaybeRefOrGetter<number>) {
  const tokens = useTokenStore();
  const query = useGetOrganizationMetadata(organizationId, () => ({
    query: { enabled: isOrgIdValid(organizationId) && Boolean(tokens.accessToken || tokens.refreshToken) },
  }));

  return {
    ...query,
    organization: computed(() => (query.data.value ? toOrganization(query.data.value) : undefined)),
  };
}

export async function resolveOrganization(organizationId: number, cache: ReturnType<typeof useQueryCache>) {
  const entry = cache.ensure(getGetOrganizationMetadataQueryOptions(organizationId, { query: { enabled: true } }));

  const state = await cache.refresh(entry);
  return state.data ? toOrganization(state.data) : null;
}

export function useOrganizationMembers(
  organizationId: MaybeRefOrGetter<number>,
  page: MaybeRefOrGetter<number>,
  size: MaybeRefOrGetter<number>,
) {
  const tokens = useTokenStore();
  const query = useGetMembers(
    organizationId,
    () => ({ page: toValue(page), size: toValue(size) }),
    () => ({
      query: { enabled: isOrgIdValid(organizationId) && Boolean(tokens.accessToken || tokens.refreshToken) },
    }),
  );

  return {
    ...query,
    members: computed(() => query.data.value?.data.map(toMember) ?? []),
    totalPages: computed(() => query.data.value?.totalPages ?? 0),
  };
}
