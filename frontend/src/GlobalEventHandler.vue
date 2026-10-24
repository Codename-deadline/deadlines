<script setup lang="ts">
import { useNotification } from "naive-ui";
import { onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { isCancellation } from "./api/errors";
import { getNumberOfPendingInvitations } from "./api/invitation";
import { useApi } from "./composables/useApi";
import { useCurrentUser } from "./composables/useCurrentUser";
import { useMetadataResolver } from "./composables/useMetadataResolver";
import { SEMI_PUBLIC_ROUTES } from "./constants/app";
import emitter from "./plugins/emitter";
import { useGlobalStateStore } from "./stores/GlobalStateStore";
import { useTokenStore } from "./stores/TokenStore";

const { user, error: userError, refresh: refreshUser } = useCurrentUser();
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

watch(userError, (error) => {
  if (error && !isCancellation(error)) displayCriticalError("failed-to-fetch-user");
}, { immediate: true });

const fetchUser = async () => {
  if (!tokenStore.accessToken && !tokenStore.refreshToken) {
    if (isSemiPublicRoute()) return;
    router.push({ path: "/auth" });
    return;
  }

  await refreshUser();
};
const handleSignUpCompleted = async () => {
  const session = tokenStore.sessionSignal();
  await fetchUser();
  if (!session.aborted && user.value) {
    router.push({ path: "/" });
    await fetchGlobalState();
  }
};
const handleSignOut = () => {
  tokenStore.$reset();
  router.push({ path: "/auth" });
};
emitter.on("signUpCompleted", handleSignUpCompleted);
emitter.on("signOut", handleSignOut);

const fetchGlobalState = async () => {
  if (!user.value) return;

  const res = await makeRequest(() => getNumberOfPendingInvitations());
  if (!res.ok) return;

  globalStateStore.$patch({
    pendingReceivedInvitations: res.data.pending
  });
}

let pollTimer: ReturnType<typeof setInterval>;
onUnmounted(() => {
  clearInterval(pollTimer);
  emitter.off("signUpCompleted", handleSignUpCompleted);
  emitter.off("signOut", handleSignOut);
  emitter.off("failedToRefreshToken", handleRefreshFailure);
});

onMounted(async () => {
  pollTimer = setInterval(async () => {
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
const handleRefreshFailure = () => {
  console.log("Failed to refresh token");
  if (env.VITE_NO_AUTH_REDIRECT?.toLowerCase() === "true") {
    console.warn("[DEV]: Auth redirect disabled");
    return;
  }
  if (isSemiPublicRoute()) return;
  router.push({ path: "/auth" });
};
emitter.on("failedToRefreshToken", handleRefreshFailure);
</script>

<template>
  <div event-handler></div>
</template>
