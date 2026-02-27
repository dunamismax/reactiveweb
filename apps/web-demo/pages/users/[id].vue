<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

const route = useRoute();
const userId = computed(() => String(route.params.id));

const { data, refresh } = await useFetch<{
  ok: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    role: "owner" | "admin" | "editor" | "viewer";
    status: "active" | "suspended";
    mustChangePassword: boolean;
    createdAt: string;
    lastSeenAt: string;
  };
  activity: Array<{ id: string; actor: string; action: string; target: string; createdAt: string }>;
  error?: { message: string };
}>(() => `/api/users/${userId.value}`, {
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
  watch: [userId],
});

const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

const feedback = ref<{ message: string; error: boolean } | null>(null);
const loadingAction = ref(false);

async function runMutation(path: string, body?: Record<string, string>) {
  feedback.value = null;
  loadingAction.value = true;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      path,
      {
        method: "POST",
        body,
      },
    );

    feedback.value = {
      message: result.ok
        ? (result.message ?? "Updated.")
        : (result.error?.message ?? "Update failed."),
      error: !result.ok,
    };

    if (result.ok && body) {
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
    }

    await refresh();
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Update failed."), error: true };
  } finally {
    loadingAction.value = false;
  }
}
</script>

<template>
  <section>
    <NuxtLink class="text-sm text-[var(--muted)] hover:text-[var(--foreground)]" to="/users">← Users</NuxtLink>

    <article v-if="data?.ok" class="mt-4 data-card">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ data.user.name }}</h1>
          <p class="text-sm text-[var(--muted)]">@{{ data.user.username }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <BadgePill :tone="data.user.role">{{ data.user.role }}</BadgePill>
            <BadgePill :tone="data.user.status === 'active' ? 'success' : 'warning'">{{ data.user.status }}</BadgePill>
            <BadgePill v-if="data.user.mustChangePassword">password change required</BadgePill>
          </div>
        </div>
        <div class="text-sm text-[var(--muted)]">
          <p>Member since: {{ new Date(data.user.createdAt).toLocaleDateString() }}</p>
          <p>Last seen: {{ new Date(data.user.lastSeenAt).toLocaleString() }}</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn btn-muted" :disabled="loadingAction" type="button" @click="runMutation(`/api/users/${userId}/cycle-role`)">
          Cycle Role
        </button>
        <button
          class="btn"
          :class="data.user.status === 'active' ? 'btn-danger' : 'btn-muted'"
          :disabled="loadingAction"
          type="button"
          @click="runMutation(`/api/users/${userId}/toggle-status`)"
        >
          {{ data.user.status === "active" ? "Suspend" : "Activate" }}
        </button>
      </div>

      <form class="mt-4 grid gap-3 md:max-w-md" @submit.prevent="runMutation(`/api/users/${userId}/reset-password`, passwordForm)">
        <p class="text-sm font-medium">Admin Password Reset</p>
        <input v-model="passwordForm.newPassword" class="input" minlength="8" placeholder="New password" required type="password" />
        <input
          v-model="passwordForm.confirmPassword"
          class="input"
          minlength="8"
          placeholder="Confirm password"
          required
          type="password"
        />
        <button class="btn btn-muted" :disabled="loadingAction" type="submit">Reset Password</button>
      </form>
    </article>

    <article v-if="data?.ok" class="mt-4 data-card">
      <p class="text-sm font-medium">User Activity</p>
      <ul class="mt-3 grid gap-2">
        <li
          v-for="event in data.activity"
          :key="event.id"
          class="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-3"
        >
          <p class="text-sm">{{ event.actor }} {{ event.action.toLowerCase() }} · {{ event.target }}</p>
          <p class="mt-1 text-xs text-[var(--muted)]">{{ new Date(event.createdAt).toLocaleString() }}</p>
        </li>
        <li v-if="!data.activity.length" class="text-sm text-[var(--muted)]">No activity yet for this user.</li>
      </ul>
    </article>

    <p v-if="feedback" class="mt-3 text-sm" :class="feedback.error ? 'text-[var(--tone-error-fg)]' : 'text-[var(--tone-success-fg)]'">
      {{ feedback.message }}
    </p>
  </section>
</template>
