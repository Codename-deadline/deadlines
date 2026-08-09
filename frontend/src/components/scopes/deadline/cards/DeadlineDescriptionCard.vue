<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";
import { NCard, NEmpty, NSwitch } from 'naive-ui';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  description?: string;
}>()

const { t } = useI18n();

const isMarkdown = ref<boolean>(true);

marked.use({
  gfm: true,
  breaks: true,
});

const openExternalLinksInNewTab = (links: NodeListOf<HTMLAnchorElement>) => {
  for (const anchor of links) {
    const href = anchor.getAttribute("href");
    if (!href) continue;

    const url = new URL(href, window.location.href);
    const isWebLink: boolean =
      url.protocol === "http:"
      || url.protocol === "https:";

    const isExternal: boolean =
      isWebLink
      && url.origin !== window.location.origin;

    if (isExternal) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  }
}

const renderMarkdown = (source: string): string => {
  const rendered = marked.parse(source);
  if (typeof rendered !== "string") {
    throw new Error("Asynchronous Marked extensions are not supported");
  }

  const sanitized = DOMPurify.sanitize(rendered);
  const document = new DOMParser().parseFromString(
    sanitized,
    "text/html",
  );

  openExternalLinksInNewTab(document.querySelectorAll<HTMLAnchorElement>("a[href]"))

  return document.body.innerHTML;
}

const rendered = computed(() => renderMarkdown(props.description ?? ""));
</script>

<template>
  <n-card class="card">
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-xl">{{ t("scopes.common.form-labels.description") }}</h2>
      <div v-if="description" class="space-x-1">
        <span>{{ t('scopes.deadline.markdown') }}</span>
        <n-switch v-model:value="isMarkdown" />
      </div>
    </div>
    <div class="prose prose-md dark:prose-invert max-w-none">
      <div
        v-if="isMarkdown && rendered"
        v-html="rendered"
      />
      <pre v-else-if="!isMarkdown && rendered" class="description" >{{ description }}</pre> 
      <n-empty v-else :description="t('scopes.deadline.no-description')"/>
    </div>
  </n-card>
</template>
