<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

const {
  data,
  pending,
  refresh: refreshDashboard,
} = await useFetch<{
  ok: boolean;
  currentUserName: string;
  users: Array<{ id: string; status: "active" | "suspended" }>;
  activity: Array<{ id: string; actor: string; action: string; target: string; createdAt: string }>;
  trend: Array<{ day: string; label: string; count: number }>;
  error?: { message: string };
}>("/api/dashboard", {
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
});

watch(
  data,
  () => {
    if (data.value?.ok) {
      useSession().refresh();
    }
  },
  { immediate: true },
);

const dashboard = computed(() => (data.value?.ok ? data.value : null));

const activeUsers = computed(() =>
  dashboard.value ? dashboard.value.users.filter((user) => user.status === "active").length : 0,
);

const suspendedUsers = computed(() =>
  dashboard.value ? dashboard.value.users.length - activeUsers.value : 0,
);

const adoptionPercent = computed(() => {
  const total = dashboard.value?.users.length ?? 0;
  if (total === 0) return 0;
  return Math.round((activeUsers.value / total) * 100);
});
</script>

<template>
  <section>
    <SectionHeader
      caption="Command Center"
      :title="dashboard ? `Welcome back, ${dashboard.currentUserName.split(' ')[0]}` : 'Dashboard'"
      description="Workspace metrics and activity powered by Drizzle + Postgres and rendered in Nuxt."
    />

    <p v-if="!dashboard && !pending" class="mt-4 text-sm text-[var(--tone-error-fg)]">
      {{ data?.error?.message ?? "Unable to load dashboard." }}
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Workspace Users" :value="String(dashboard?.users.length ?? 0)" trend="Total managed accounts" />
      <StatCard label="Active Accounts" :value="String(activeUsers)" trend="Ready for access" />
      <StatCard label="Suspended" :value="String(suspendedUsers)" trend="Require admin review" />
      <StatCard label="Adoption" :value="`${adoptionPercent}%`" trend="Active user ratio" />
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      <article class="data-card lg:col-span-2">
        <div class="flex items-center justify-between">
          <p class="text-sm text-[var(--muted)]">Recent Activity</p>
          <NuxtLink class="text-xs text-[var(--accent)] hover:underline" to="/activity">View all</NuxtLink>
        </div>

        <ul class="mt-3 grid gap-3">
          <li
            v-for="event in (dashboard?.activity ?? []).slice(0, 8)"
            :key="event.id"
            class="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-3"
          >
            <p class="text-sm font-medium">{{ event.actor }} {{ event.action.toLowerCase() }}</p>
            <p class="mt-1 text-sm text-[var(--muted)]">{{ event.target }}</p>
            <time class="mt-1 block text-xs text-[var(--muted)]">{{ new Date(event.createdAt).toLocaleString() }}</time>
          </li>
          <li v-if="!dashboard?.activity?.length" class="rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--muted)]">
            No activity yet.
          </li>
        </ul>
      </article>

      <article class="data-card">
        <div class="flex items-center justify-between">
          <p class="text-sm text-[var(--muted)]">Activity Trend</p>
          <button class="btn btn-muted" type="button" @click="refreshDashboard()">Refresh</button>
        </div>
        <div class="mt-4 flex items-end gap-2" style="height: 120px">
          <div v-for="point in dashboard?.trend ?? []" :key="point.day" class="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              class="w-full rounded-sm bg-[var(--accent)]"
              :style="{ height: `${Math.max(6, point.count * 10)}px` }"
              :title="`${point.label}: ${point.count}`"
            />
            <span class="text-[10px] text-[var(--muted)]">{{ point.label }}</span>
            <span class="text-[10px] font-medium">{{ point.count }}</span>
          </div>
        </div>
      </article>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-3">
      <NuxtLink class="data-card card-hover text-sm" to="/users">
        <p class="font-medium">User Management</p>
        <p class="mt-1 text-[var(--muted)]">Create and manage workspace members.</p>
      </NuxtLink>
      <NuxtLink class="data-card card-hover text-sm" to="/settings">
        <p class="font-medium">Settings</p>
        <p class="mt-1 text-[var(--muted)]">Update profile and rotate credentials.</p>
      </NuxtLink>
      <NuxtLink class="data-card card-hover text-sm" to="/stack">
        <p class="font-medium">Stack Coverage</p>
        <p class="mt-1 text-[var(--muted)]">Inspect framework, auth, and data contracts.</p>
      </NuxtLink>
    </div>
  </section>
</template>
