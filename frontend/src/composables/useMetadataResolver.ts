import { useNotification } from "naive-ui";
import { useI18n } from "vue-i18n";
import { isCancellation } from "@/api/errors";
import { getMetadataVersions, getRegisteredBots } from "@/api/generated/endpoints/metadata/metadata";
import { getMetadata } from "@/api/generated/endpoints/roles/roles";
import type { MetadataResponse } from "@/api/generated/models";
import { type Metadata, useMetadataStore } from "@/stores/MetadataStore";
import { useTokenStore } from "@/stores/TokenStore";

export function useMetadataResolver() {
  const metadataStore = useMetadataStore();
  const tokens = useTokenStore();
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
    fetch: () => Promise<Metadata[Key]>,
    session: AbortSignal,
  ) => {
    if (metadataStore.metadata[key]?.version === version) return;

    try {
      const value = await fetch();
      session.throwIfAborted();
      metadataStore.update(key, value, version);
    } catch (error) {
      if (!session.aborted && !isCancellation(error)) displayCriticalError("failed-to-fetch-metadata");
    }
  };

  const resolveOutdatedMetadata = async () => {
    const session = tokens.sessionSignal();
    let versions: MetadataResponse;
    try {
      versions = await getMetadataVersions();
      session.throwIfAborted();
    } catch (error) {
      if (!session.aborted && !isCancellation(error)) displayCriticalError("failed-to-fetch-metadata-versions");
      return;
    }

    await Promise.all([
      resolveMetadata("roles", versions.rolesMetadataVersion, getMetadata, session),
      resolveMetadata("bots", versions.botsMetadataVersion, getRegisteredBots, session),
    ]);
  };

  return { resolveOutdatedMetadata };
}
