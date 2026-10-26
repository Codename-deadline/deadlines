<script setup lang="ts">
import { Key, Link as LinkIcon, SignOutAlt, TrashAlt } from '@vicons/fa';
import { NAlert, NAvatar, NButton, NCard, NIcon, NPopconfirm, NSpin, useMessage } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDeleteUser } from '@/api/generated/endpoints/user/user';
import type { MessengerAccountDTO } from '@/api/generated/models';
import CardWithHeader from '@/components/CardWithHeader.vue';
import GlobalHeader from '@/components/home/common/GlobalHeader.vue';
import ShortLongTimeDisplay from '@/components/home/common/ShortLongTimeDisplay.vue';
import PropertyValue from '@/components/PropertyValue.vue';
import ChangePasswordDialog from '@/components/profile/dialogs/ChangePasswordDialog.vue';
import EditProfileDialog from '@/components/profile/dialogs/EditProfileDialog.vue';
import LinkMessengerAccountDialog from '@/components/profile/dialogs/LinkMessengerAccountDialog.vue';
import MessengerAccountCard from '@/components/profile/MessengerAccountCard.vue';
import SubHeader from '@/components/SubHeader.vue';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useEndServerSessions } from '@/composables/useEndServerSessions';
import { useLinkedAccounts, useUnlinkMessengerAccount } from '@/composables/useLinkedAccounts';
import { useRequestError } from '@/composables/useRequestError';
import { tActionConfirmation } from '@/locales/utils';
import emitter from '@/plugins/emitter';
import { useTokenStore } from '@/stores/TokenStore';
import { requestErrorNotification } from '@/utils/requestError';
import { getAvatarText } from '@/utils/strings';

const { t, te } = useI18n();
const message = useMessage();
const { user } = useCurrentUser();

const {
  data: accounts,
  error: accountsError,
  isLoading: isLoadingAccounts,
  refetch: refetchAccounts,
} = useLinkedAccounts();
const { mutateAsync: unlinkAccount, isLoading: isUnlinking } = useUnlinkMessengerAccount();
const { mutateAsync: deleteAccount, isLoading: isDeleting } = useDeleteUser();
const { mutateAsync: endServerSessions, isLoading: isSigningOutAll } = useEndServerSessions();

const displayRequestError = useRequestError();
const linkedAccounts = computed(() => accounts.value ?? []);
const accountsFailure = computed(() =>
  accountsError.value
    ? requestErrorNotification(accountsError.value, (key, params) => (te(key) ? t(key, params ?? {}) : undefined))
    : undefined,
);
const unlinkingAccountKey = ref<string | null>(null);

const dialogState = ref<"profile" | "account" | "password" | "closed">("closed");
const tokens = useTokenStore();

// Discard client-owned form drafts too when the account changes on this route.
watch(
  () => tokens.sessionVersion,
  () => {
    dialogState.value = "closed";
    unlinkingAccountKey.value = null;
  },
  { flush: "sync" },
);

const accountKey = (account: MessengerAccountDTO) => `${account.messenger}:${account.accountId}`;

const handleUnlinkAccount = async (account: MessengerAccountDTO) => {
  const key = accountKey(account);
  if (isUnlinking.value) return;

  unlinkingAccountKey.value = key;
  try {
    await unlinkAccount({ unlinkMessengerAccountRequest: account });
    message.success(t("profile.accounts.unlinked"));
  } catch (error) {
    displayRequestError(error);
  } finally {
    unlinkingAccountKey.value = null;
  }
};

const handleDeleteUser = async () => {
  if (isDeleting.value || isSigningOutAll.value) return;
  try {
    await deleteAccount();
    emitter.emit("signOut");
  } catch (error) {
    displayRequestError(error);
  }
};

const handleSignOutAll = async () => {
  if (isSigningOutAll.value || isDeleting.value) return;
  try {
    await endServerSessions();
    emitter.emit("signOut");
  } catch (error) {
    displayRequestError(error);
  }
};
</script>

<template>
  <global-header/>
  <main class="my-8 flex w-full justify-center">
    <div class="w-9/10 sm:w-4/6 md:w-1/2 xl:w-3/8">
      <sub-header/>
      <section v-if="user" class="space-y-6 mt-4">
        <n-card class="card">
          <div class="flex justify-center">
            <div class="flex flex-col items-center gap-4">
              <n-avatar round class="w-24! h-24! text-3xl!">{{ getAvatarText(user.fullName) }}</n-avatar>
              <div class="text-center">
                <h2 class="text-2xl">{{ user.fullName }}</h2>
                <p class="w-full font-medium description mb-3">@{{ user.username }}</p>
                <n-button role="button" class="rounded-lg!" @click="dialogState = 'profile'">
                  {{ t('profile.edit') }}
                </n-button>
              </div>
            </div>
          </div>
        </n-card>
        <card-with-header class="account-card" header-selector="profile.accounts.header">
          <template #header>
            <n-button role="button" type="info" class="rounded-lg!" @click="dialogState = 'account'">
              <template #icon>
                <n-icon><link-icon /></n-icon>
              </template>
              {{ t("profile.accounts.link") }}
            </n-button>
          </template>
          <n-spin :show="isLoadingAccounts">
            <n-alert v-if="accountsFailure" type="error" :title="accountsFailure.title" class="mb-3">
              {{ accountsFailure.content }}
              <n-button class="mt-2" :loading="isLoadingAccounts" @click="refetchAccounts()">
                {{ t("actions.retry") }}
              </n-button>
            </n-alert>
            <div v-if="linkedAccounts.length" class="space-y-3">
              <messenger-account-card
                v-for="account in linkedAccounts"
                :key="accountKey(account)"
                :account="account"
                :unlinking="unlinkingAccountKey === accountKey(account)"
                @unlink="handleUnlinkAccount"
              />
            </div>
            <p v-else-if="!isLoadingAccounts && !accountsFailure" class="description py-4 text-center">
              {{ t("profile.accounts.empty") }}
            </p>
          </n-spin>
        </card-with-header>
        <card-with-header header-selector="profile.account-info">
          <property-value property-selector="profile.properties.language" :add-divider="true">
            <b>{{ t(`language.${user.language.toLowerCase()}`) }}</b>
          </property-value>
          <property-value property-selector="profile.properties.time-zone" :add-divider="true">
            <b>{{ user.timeZone }}</b>
          </property-value>
          <property-value property-selector="profile.properties.joined">
            <b>
              <short-long-time-display
                :long-format="true"
                :time="user.joinedAt"
                :time-zone="user.timeZone"
              />
            </b>
          </property-value>
        </card-with-header>
        <card-with-header header-selector="actions.header">
          <div class="flex flex-col gap-3">
            <n-button
              @click="dialogState = 'password'"
              role="button"
            >
              <template #icon>
                <n-icon>
                  <Key/>
                </n-icon>
              </template>
              {{ t(`profile.password.title`) }}
            </n-button>
            <n-button
              @click="emitter.emit('signOut');"
              role="button"
            >
              <template #icon>
                <n-icon>
                  <sign-out-alt/>
                </n-icon>
              </template>
              {{ t(`profile.actions.sign-out`) }}
            </n-button>
            <n-popconfirm @positive-click="handleSignOutAll">
              <template #trigger>
                <n-button type="error" :loading="isSigningOutAll" :disabled="isDeleting">
                  <template #icon>
                    <n-icon>
                      <sign-out-alt/>
                    </n-icon>
                  </template>
                  {{ t(`profile.actions.sign-out-all`) }}
                </n-button>
              </template>
              {{ tActionConfirmation(t, "end-all-sessions") }}
            </n-popconfirm>
            <n-popconfirm @positive-click="handleDeleteUser">
              <template #trigger>
                <n-button type="error" :loading="isDeleting" :disabled="isSigningOutAll">
                  <template #icon>
                    <n-icon>
                      <trash-alt />
                    </n-icon>
                  </template>
                  {{ t(`profile.actions.delete`) }}
                </n-button>
              </template>
              {{ tActionConfirmation(t, "delete-account") }}
            </n-popconfirm>
          </div>
        </card-with-header>
      </section>
    </div>
  </main>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100 backdrop-blur-sm"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="dialogState !== 'closed'"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/30 backdrop-blur-sm"
        @click="dialogState = 'closed'"
      />
      <edit-profile-dialog
        v-if="dialogState === 'profile'"
        class="profile-dialog"
        @close="dialogState = 'closed'"
      />
      <link-messenger-account-dialog
        v-if="dialogState === 'account'"
        class="profile-dialog"
        @close="dialogState = 'closed'"
      />
      <change-password-dialog
        v-if="dialogState === 'password'"
        class="profile-dialog"
        @close="dialogState = 'closed'"
      />
    </div>
  </Transition>
</template>

<style>
@media (width < 640px) {
  .account-card header {
    align-items: start;
    flex-direction: column;
  }
  .account-card header > button {
    width: 100%
  }
}
.profile-dialog {
  position: relative;
  max-width: var(--container-lg);
  border-radius: var(--radius-xl);
}
</style>
