<script setup lang="ts">
import { useNotification } from "naive-ui";
import { onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useInvitationPolling } from "@/composables/invitations/useInvitationPolling";
import { useMetadataResolver } from "@/composables/shared/useMetadataResolver";
import { useCurrentUser } from "@/composables/users/useCurrentUser";
import { isCancellation } from "./api/errors";
import { SEMI_PUBLIC_ROUTES } from "./constants/app";
import emitter from "./plugins/emitter";
import { useTokenStore } from "./stores/TokenStore";

const { user, error: userError, refresh: refreshUser } = useCurrentUser();
const tokenStore = useTokenStore();
useInvitationPolling();

const { t } = useI18n();
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
  }
};
const handleSignOut = () => {
  tokenStore.$reset();
  router.push({ path: "/auth" });
};
emitter.on("signUpCompleted", handleSignUpCompleted);
emitter.on("signOut", handleSignOut);

onUnmounted(() => {
  emitter.off("signUpCompleted", handleSignUpCompleted);
  emitter.off("signOut", handleSignOut);
  emitter.off("failedToRefreshToken", handleRefreshFailure);
});

onMounted(async () => {
  await fetchUser();
  await resolveOutdatedMetadata();
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
