<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

const route = useRoute();

const query = computed(() => ({
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 20),
  action: typeof route.query.action === "string" ? route.query.action : undefined,
  q: typeof route.query.q === "string" ? route.query.q : undefined,
}));

const { data, refresh: refreshActivity } = await useFetch<{
  ok: boolean;
  activity: Array<{ id: string; actor: string; action: string; target: string; createdAt: string }>;
  total: number;
  page: number;
  pageSize: number;
  query: { action?: string; q?: string };
  error?: { message: string };
}>("/api/activity", {
  query,
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
  watch: [query],
});

const search = ref(query.value.q ?? "");
const actionFilter = ref(query.value.action ?? "All");

watch(query, (next) => {
  search.value = next.q ?? "";
  actionFilter.value = next.action ?? "All";
});

const totalPages = computed(() => {
  const total = data.value?.total ?? 0;
  const pageSize = data.value?.pageSize ?? 20;
  return Math.max(1, Math.ceil(total / pageSize));
});

const exportUrl = computed(() => {
  const params = new URLSearchParams();
  if (actionFilter.value && actionFilter.value !== "All") {
    params.set("action", actionFilter.value);
  }
  if (search.value.trim()) {
    params.set("q", search.value.trim());
  }
  return params.toString() ? `/api/activity/export?${params.toString()}` : "/api/activity/export";
});

async function applyFilters(page = 1) {
  const params = new URLSearchParams();
  if (actionFilter.value !== "All") {
    params.set("action", actionFilter.value);
  }
  if (search.value.trim()) {
    params.set("q", search.value.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  await navigateTo(`/activity${params.toString() ? `?${params.toString()}` : ""}`);
}
</script>

<template>
  <section>
    <SectionHeader
      caption="Activity Log"
      title="Workspace Audit Trail"
      description="Every user mutation and auth event is recorded and filterable."
    />

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <select v-model="actionFilter" class="input max-w-[180px]" @change="applyFilters()">
        <option>All</option>
        <option>Created</option>
        <option>Updated</option>
        <option>Activated</option>
        <option>Suspended</option>
        <option>SignInSuccess</option>
        <option>SignInFailure</option>
        <option>SignOut</option>
      </select>
      <input v-model="search" class="input max-w-[280px]" placeholder="Search events" type="search" @keyup.enter="applyFilters()" />
      <button class="btn btn-muted" type="button" @click="applyFilters()">Apply</button>
      <a class="btn btn-muted" :href="exportUrl">Download CSV</a>
      <button class="btn btn-muted ml-auto" type="button" @click="refreshActivity()">Refresh</button>
    </div>

    <div class="mt-4 grid gap-3">
      <article
        v-for="event in data?.activity ?? []"
        :key="event.id"
        class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium">{{ event.actor }}</p>
          <BadgePill>{{ event.action }}</BadgePill>
        </div>
        <p class="mt-2 text-sm text-[var(--muted)]">{{ event.target }}</p>
        <time class="mt-2 block text-xs text-[var(--muted)]">{{ new Date(event.createdAt).toLocaleString() }}</time>
      </article>
      <p v-if="!(data?.activity?.length ?? 0)" class="text-sm text-[var(--muted)]">No events match your filters.</p>
    </div>

    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
      <button class="btn btn-muted" :disabled="(data?.page ?? 1) <= 1" type="button" @click="applyFilters((data?.page ?? 1) - 1)">
        ← Prev
      </button>
      <span class="text-sm text-[var(--muted)]">Page {{ data?.page ?? 1 }} of {{ totalPages }}</span>
      <button
        class="btn btn-muted"
        :disabled="(data?.page ?? 1) >= totalPages"
        type="button"
        @click="applyFilters((data?.page ?? 1) + 1)"
      >
        Next →
      </button>
    </div>
  </section>
</template>
