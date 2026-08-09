<script setup lang="ts">
import { useNotification } from "naive-ui";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { getNumberOfPendingInvitations } from "./api/invitation";
import { getMe } from "./api/user";
import { useApi } from "./composables/useApi";
import { useMetadataResolver } from "./composables/useMetadataResolver";
import { SEMI_PUBLIC_ROUTES } from "./constants/app";
import emitter from "./plugins/emitter";
import { useGlobalStateStore } from "./stores/GlobalStateStore";
import { useTokenStore } from "./stores/TokenStore";
import { useUserStore } from "./stores/UserStore";

const userStore = useUserStore();
const tokenStore = useTokenStore();
const globalStateStore = useGlobalStateStore();

const { t } = useI18n();
const { makeRequest } = useApi();
const { resolveOutdatedMetadata } = useMetadataResolver();

const notification = useNotification();
const router = useRouter();
const isSemiPublicRoute = () => SEMI_PUBLIC_ROUTES.includes(String(router.currentRoute.value.name));

const displayCriticalError = (errorSelector: string) => {
  notification.error({
    title: t("errors.critical-error"),
    content: `${t(`errors.${errorSelector}`)}\n${t("actions.page-reload")}`,
    closable: true,
  });
};

const fetchUser = async () => {
  if (!tokenStore.accessToken && !tokenStore.refreshToken) {
    userStore.$reset();
    if (isSemiPublicRoute()) return;
    router.push({ path: "/auth" });
    return;
  }

  const res = await makeRequest(() => getMe());
  if (!res.ok) {
    displayCriticalError("failed-to-fetch-user");
    return;
  }

  userStore.setUser(res.data);
};
emitter.on("signUpCompleted", async () => {
  await fetchUser();
  router.push({ path: "/" });
});
emitter.on("signOut", async () => {
  userStore.$reset();
  tokenStore.$reset();
  globalStateStore.$reset();
  router.push({ path: "/auth" });
})

const fetchGlobalState = async () => {
  if (!userStore.isAvailable) return;
  
  const res = await makeRequest(() => getNumberOfPendingInvitations());
  if (!res.ok) return;

  globalStateStore.$patch({
    pendingReceivedInvitations: res.data.pending
  });
}
onMounted(async () => {
  setInterval(async () => {
    // Ideally this is a websocket connection, but the size is negligible ~0.5kb
    // which is fine to occasionally poll
    await fetchGlobalState();
  }, 5 * 60 * 1000);

  // fetchGlobalState depends on user being present
  // => load the user first
  await fetchUser();
  await Promise.all([
    resolveOutdatedMetadata(),
    fetchGlobalState(),
  ])
});

const env = import.meta.env;
emitter.on("failedToRefreshToken", () => {
  console.log("Failed to refresh token");
  if (env.VITE_NO_AUTH_REDIRECT?.toLowerCase() === "true") {
    console.warn("[DEV]: Auth redirect disabled");
    return;
  }
  userStore.$reset();
  if (isSemiPublicRoute()) return;
  router.push({ path: "/auth" });
});
</script>

<template>
  <div event-handler></div>
</template>
