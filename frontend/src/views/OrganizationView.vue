<script setup lang="ts">
import { useRouter } from "vue-router";
import type { OrganizationListModel } from "@/api/adapters/organization";
import PageLayout from "@/components/home/common/PageLayout.vue";
import CreateOrganizationDialog from "@/components/home/organizations/CreateOrganizationDialog.vue";
import EditOrganizationDialog from "@/components/home/organizations/EditOrganizationDialog.vue";
import OrganizationCard from "@/components/home/organizations/OrganizationCard.vue";
import { useOrganizations } from "@/composables/organizations/useOrganizations";

const router = useRouter();
const { items, isLoading, error, hasNextPage, loadMore, retry } = useOrganizations();
const onCardClick = (organization: OrganizationListModel) => {
  router.push({ path: "/threads", query: { orgId: organization.id } });
};
</script>

<template>
  <PageLayout
    :items="items" :loading="isLoading" :error="error" :has-more="hasNextPage" :load-more="loadMore" :retry="retry"
    :entity-card-component="OrganizationCard" :edit-dialog-component="EditOrganizationDialog"
    :create-dialog-component="CreateOrganizationDialog" scope-type="organization" @card-clicked="onCardClick"
  />
</template>
