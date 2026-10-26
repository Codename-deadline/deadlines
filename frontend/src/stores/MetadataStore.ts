import { defineStore } from "pinia";
import { ref } from "vue";
import type { BotDTO, RolesMetadataResponse } from "@/api/generated/models";

type MetadataWithVersion<T> = {
  value: T;
  version: string;
};

export type Metadata = {
  roles: RolesMetadataResponse;
  bots: BotDTO[];
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
      storage: typeof localStorage === "undefined" ? undefined : localStorage,
    },
  },
);
