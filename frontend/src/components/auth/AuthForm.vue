<script setup lang="ts">
import SignInForm from "@/components/auth/sign-in/SignInForm.vue";
import SignUpForm from "@/components/auth/sign-up/SignUpForm.vue";
import type { AuthMethod } from "@/types/api";

const props = defineProps<{
  method: AuthMethod;
  isSignUp: boolean;
}>();
</script>

<template>
  <SignUpForm v-if="isSignUp" :method="method"/>
  <SignInForm v-else :method="method"/>
</template>
