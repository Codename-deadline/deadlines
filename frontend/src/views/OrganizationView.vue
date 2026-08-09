<script setup lang="ts">
import { useRouter } from "vue-router";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import { getOrganizations } from "@/api/user";
import PageLayout from "@/components/home/common/PageLayout.vue";
import CreateOrganizationDialog from "@/components/home/organizations/CreateOrganizationDialog.vue";
import EditOrganizationDialog from "@/components/home/organizations/EditOrganizationDialog.vue";
import OrganizationCard from "@/components/home/organizations/OrganizationCard.vue";
import { useCurrentScopeStore } from "@/stores/CurrentScopeStore";

const router = useRouter();
const currentScopeStore = useCurrentScopeStore();

const onCardClick = (org: OrganizationWithStatsAndRole) => {
  router.push({ path: '/threads', query: { orgId: org.id } });
  currentScopeStore.withScope({ entity: org, type: "organization" });
}
</script>

<template>
  <page-layout
    @card-clicked="onCardClick"
    :entity-card-component="OrganizationCard"
    :edit-dialog-component="EditOrganizationDialog"
    :create-dialog-component="CreateOrganizationDialog"
    :fetcher="getOrganizations"
    :reset="true"
    scope-type="organization"
  />
</template>
