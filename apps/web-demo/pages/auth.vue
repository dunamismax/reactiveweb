<script setup lang="ts">
definePageMeta({ middleware: "guest-only" });

import { getSafeAuthRedirectTarget } from "~/utils/auth-redirect";

const runtimeConfig = useRuntimeConfig();

const signInUsername = ref(runtimeConfig.public.ownerUsername || "owner");
const signInPassword = ref("");
const signUpUsername = ref("");
const signUpName = ref("");
const signUpPassword = ref("");
const signUpConfirmPassword = ref("");
const feedback = ref<{ message: string; error: boolean } | null>(null);
const submitting = ref(false);

const route = useRoute();

const queryFeedback = computed(() => {
  if (route.query.error) {
    return { message: "Sign-in failed. Check your credentials and try again.", error: true };
  }
  if (route.query.status === "signed-out") {
    return { message: "Session cleared.", error: false };
  }
  if (route.query.next) {
    return { message: "Sign in to continue.", error: false };
  }
  return null;
});

async function signIn() {
  feedback.value = null;
  submitting.value = true;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      "/api/auth/sign-in",
      {
        method: "POST",
        body: {
          username: signInUsername.value,
          password: signInPassword.value,
        },
      },
    );

    if (!result.ok) {
      feedback.value = { message: result.error?.message ?? "Sign-in failed.", error: true };
      return;
    }

    await useSession().refresh();
    await navigateTo(getSafeAuthRedirectTarget(route.query.next));
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Sign-in failed."), error: true };
  } finally {
    submitting.value = false;
  }
}

async function signUp() {
  feedback.value = null;
  submitting.value = true;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      "/api/auth/sign-up",
      {
        method: "POST",
        body: {
          username: signUpUsername.value,
          name: signUpName.value,
          password: signUpPassword.value,
          confirmPassword: signUpConfirmPassword.value,
        },
      },
    );

    if (!result.ok) {
      feedback.value = { message: result.error?.message ?? "Sign-up failed.", error: true };
      return;
    }

    feedback.value = {
      message: result.message ?? "Account created. Sign in with your new credentials.",
      error: false,
    };

    signUpUsername.value = "";
    signUpName.value = "";
    signUpPassword.value = "";
    signUpConfirmPassword.value = "";
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Sign-up failed."), error: true };
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="grid w-full gap-4 lg:grid-cols-2">
    <article class="data-card">
      <SectionHeader
        caption="Auth Lab"
        title="Username-First Sign In"
        description="Sign in with the seeded owner account or any created user account."
      />
      <form class="mt-4 grid gap-3" @submit.prevent="signIn">
        <label class="grid gap-1 text-sm">
          <span>Username</span>
          <input v-model="signInUsername" class="input" autocomplete="username" required type="text" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>Password</span>
          <input
            v-model="signInPassword"
            class="input"
            autocomplete="current-password"
            required
            type="password"
          />
        </label>
        <button class="btn btn-primary" :disabled="submitting" type="submit">Sign In</button>
      </form>
      <p v-if="queryFeedback" class="mt-3 text-sm" :class="queryFeedback.error ? 'text-[var(--tone-error-fg)]' : 'text-[var(--tone-success-fg)]'">
        {{ queryFeedback.message }}
      </p>
      <p v-if="feedback" class="mt-2 text-sm" :class="feedback.error ? 'text-[var(--tone-error-fg)]' : 'text-[var(--tone-success-fg)]'">
        {{ feedback.message }}
      </p>
    </article>

    <article class="data-card">
      <SectionHeader
        caption="Public Signup"
        title="Create Viewer Account"
        description="Public signup always provisions viewer role users with local password credentials."
      />
      <form class="mt-4 grid gap-3" @submit.prevent="signUp">
        <label class="grid gap-1 text-sm">
          <span>Display Name</span>
          <input v-model="signUpName" class="input" required type="text" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>Username</span>
          <input v-model="signUpUsername" class="input" required type="text" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>Password</span>
          <input v-model="signUpPassword" class="input" minlength="8" required type="password" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>Confirm Password</span>
          <input v-model="signUpConfirmPassword" class="input" minlength="8" required type="password" />
        </label>
        <button class="btn btn-muted" :disabled="submitting" type="submit">Create Account</button>
      </form>
    </article>
  </section>
</template>
