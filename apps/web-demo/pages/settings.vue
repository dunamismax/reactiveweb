<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

const route = useRoute();

const { data, refresh } = await useFetch<{
  ok: boolean;
  profile: {
    id: string;
    name: string;
    username: string;
    mustChangePassword: boolean;
    role: string;
    lastSeenAt: string | null;
  };
  error?: { message: string };
}>("/api/settings", {
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
});

const profileName = ref("");
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const feedback = ref<{ message: string; error: boolean } | null>(null);
const loading = ref(false);

watch(
  () => data.value,
  (next) => {
    if (next?.ok) {
      profileName.value = next.profile.name;
    }
  },
  { immediate: true },
);

async function saveProfile() {
  loading.value = true;
  feedback.value = null;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      "/api/settings/profile",
      {
        method: "POST",
        body: {
          name: profileName.value,
        },
      },
    );

    feedback.value = {
      message: result.ok
        ? (result.message ?? "Profile updated.")
        : (result.error?.message ?? "Update failed."),
      error: !result.ok,
    };

    if (result.ok) {
      await refresh();
      await useSession().refresh();
    }
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Update failed."), error: true };
  } finally {
    loading.value = false;
  }
}

async function savePassword() {
  loading.value = true;
  feedback.value = null;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      "/api/settings/password",
      {
        method: "POST",
        body: passwordForm,
      },
    );

    feedback.value = {
      message: result.ok
        ? (result.message ?? "Password updated.")
        : (result.error?.message ?? "Update failed."),
      error: !result.ok,
    };

    if (result.ok) {
      passwordForm.currentPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      await refresh();
      await useSession().refresh();
    }
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Update failed."), error: true };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section>
    <SectionHeader
      caption="Settings"
      title="User Settings"
      description="Manage profile details and account credentials."
    />

    <div
      v-if="data?.ok && (data.profile.mustChangePassword || route.query.required === 'password-change')"
      class="mt-4 rounded-xl border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] p-4 text-sm text-[var(--tone-warning-fg)]"
    >
      Your password must be changed before you can access other routes.
    </div>

    <div class="mt-5 grid gap-4 lg:grid-cols-2">
      <article class="data-card">
        <p class="text-sm font-medium">Profile</p>
        <dl v-if="data?.ok" class="mt-3 grid gap-2 text-sm">
          <div class="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <dt class="text-[var(--muted)]">Username</dt>
            <dd>@{{ data.profile.username }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <dt class="text-[var(--muted)]">Role</dt>
            <dd>{{ data.profile.role }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-[var(--muted)]">Last Seen</dt>
            <dd>{{ data.profile.lastSeenAt ? new Date(data.profile.lastSeenAt).toLocaleString() : "Never" }}</dd>
          </div>
        </dl>

        <form class="mt-4 grid gap-3" @submit.prevent="saveProfile">
          <input v-model="profileName" class="input" required type="text" />
          <button class="btn btn-primary" :disabled="loading" type="submit">Save Name</button>
        </form>
      </article>

      <article class="data-card">
        <p class="text-sm font-medium">Password</p>
        <form class="mt-4 grid gap-3" @submit.prevent="savePassword">
          <input
            v-model="passwordForm.currentPassword"
            class="input"
            autocomplete="current-password"
            placeholder="Current password"
            required
            type="password"
          />
          <input
            v-model="passwordForm.newPassword"
            class="input"
            autocomplete="new-password"
            minlength="8"
            placeholder="New password"
            required
            type="password"
          />
          <input
            v-model="passwordForm.confirmPassword"
            class="input"
            autocomplete="new-password"
            minlength="8"
            placeholder="Confirm password"
            required
            type="password"
          />
          <button class="btn btn-muted" :disabled="loading" type="submit">Update Password</button>
        </form>
      </article>
    </div>

    <p v-if="feedback" class="mt-3 text-sm" :class="feedback.error ? 'text-[var(--tone-error-fg)]' : 'text-[var(--tone-success-fg)]'">
      {{ feedback.message }}
    </p>
  </section>
</template>
