import { useNotification } from "naive-ui";
import { useI18n } from "vue-i18n";
import { getApplicationMetadataVersions, getBotsMetadata } from "@/api/metadata";
import { getRolesMetadata } from "@/api/roles";
import { type Metadata, useMetadataStore } from "@/stores/MetadataStore";
import type { OperationResult } from "@/types/OperationResult";
import { useApi } from "./useApi";

export function useMetadataResolver() {
  const metadataStore = useMetadataStore();
  const { makeRequest } = useApi();
  const { t } = useI18n();
  const notification = useNotification();

  const displayCriticalError = (errorSelector: string) => {
    notification.error({
      title: t("errors.critical-error"),
      content: `${t(`errors.${errorSelector}`)}\n${t("actions.page-reload")}`,
      closable: true,
    });
  };

  const resolveMetadata = async <Key extends keyof Metadata>(
    key: Key,
    version: string,
    fetch: () => Promise<OperationResult<Metadata[Key]>>,
  ) => {
    if (metadataStore.metadata[key]?.version === version) return;

    const result = await fetch();
    if (!result.ok) {
      displayCriticalError("failed-to-fetch-metadata");
      return;
    }

    metadataStore.update(key, result.data, version);
  };

  const resolveOutdatedMetadata = async () => {
    const result = await makeRequest(() => getApplicationMetadataVersions());
    if (!result.ok) {
      displayCriticalError("failed-to-fetch-metadata-versions");
      return;
    }

    await Promise.all([
      resolveMetadata("roles", result.data.rolesMetadataVersion, () => makeRequest(() => getRolesMetadata())),
      resolveMetadata("bots", result.data.botsMetadataVersion, () => makeRequest(() => getBotsMetadata())),
    ]);
  };

  return { resolveOutdatedMetadata };
}
