import type { useQueryCache } from "@pinia/colada";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type OrganizationListModel, toOrganization } from "@/api/adapters/organization";
import { toMember } from "@/api/adapters/user";
import {
  getGetOrganizationMetadataQueryOptions,
  getGetOrganizationsByUserQueryKey,
  getOrganizationsByUser,
  useGetMembers,
  useGetOrganizationMetadata,
} from "@/api/generated/endpoints/organizations/organizations";
import type { OrganizationResponseWithRole } from "@/api/generated/models";
import { useDefaultQueryEnabled } from "@/composables/shared/useDefaultQueryEnabled";
import { usePagedList } from "@/composables/shared/usePagedList";

export const organizationsListPrefix = getGetOrganizationsByUserQueryKey({ page: 0 }).slice(0, -1);
export const organizationsListKey = [...organizationsListPrefix, "infinite"] as const;

function isOrgIdValid(organizationId: MaybeRefOrGetter<number>): boolean {
  return toValue(organizationId) > 0;
}

export function useOrganizations() {
  return usePagedList<OrganizationResponseWithRole, OrganizationListModel>(() => ({
    key: organizationsListKey,
    fetchPage: (page, signal) => getOrganizationsByUser({ page }, { signal }),
    map: toOrganization,
  }));
}

export function useOrganization(organizationId: MaybeRefOrGetter<number>) {
  const defaultEnabled = useDefaultQueryEnabled();
  const query = useGetOrganizationMetadata(organizationId, () => ({
    query: { enabled: isOrgIdValid(organizationId) && defaultEnabled() },
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
  const defaultEnabled = useDefaultQueryEnabled();
  const query = useGetMembers(
    organizationId,
    () => ({ page: toValue(page), size: toValue(size) }),
    () => ({
      query: { enabled: isOrgIdValid(organizationId) && defaultEnabled() },
    }),
  );

  return {
    ...query,
    members: computed(() => query.data.value?.data.map(toMember) ?? []),
    totalPages: computed(() => query.data.value?.totalPages ?? 0),
  };
}
