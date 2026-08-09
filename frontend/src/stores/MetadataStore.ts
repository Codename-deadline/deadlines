import { defineStore } from "pinia";
import { ref } from "vue";
import type { BotsMetadata } from "@/api/schemas/metadata/BotsMetadata";
import type { RolesMetadata } from "@/api/schemas/roles/metadata";

type MetadataWithVersion<T> = {
  value: T;
  version: string;
};

export type Metadata = {
  roles: RolesMetadata;
  bots: BotsMetadata;
};

type MetadataState = {
  [Key in keyof Metadata]?: MetadataWithVersion<Metadata[Key]>;
};

export const useMetadataStore = defineStore(
  "metadata",
  () => {
    const metadata = ref<MetadataState>({});

    function update<Key extends keyof Metadata>(key: Key, value: Metadata[Key], version: string) {
      metadata.value = {
        ...metadata.value,
        [key]: { value, version },
      };
    }

    function $reset() {
      metadata.value = {};
    }

    return { metadata, update, $reset };
  },
  {
    persist: {
      key: "metadata-store",
      storage: localStorage,
    },
  },
);
