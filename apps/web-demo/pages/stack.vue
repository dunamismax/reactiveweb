<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

const runtimeConfig = useRuntimeConfig();

const { data } = await useFetch<{
  ok: boolean;
  stack: Array<{ label: string; detail: string }>;
  tables: string[];
  error?: { message: string };
}>("/api/stack", {
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
});
</script>

<template>
  <section>
    <SectionHeader
      caption="Stack Matrix"
      title="Technology Coverage"
      description="Nuxt + Vue app layer on top of shared Drizzle schema and validation contracts."
    />

    <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="entry in data?.stack ?? []" :key="entry.label" class="data-card card-hover">
        <p class="text-sm font-medium">{{ entry.label }}</p>
        <p class="mt-2 text-sm text-[var(--muted)]">{{ entry.detail }}</p>
      </article>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <article class="data-card">
        <p class="text-sm font-medium">Drizzle/Postgres Contract</p>
        <ul class="mt-3 grid gap-2 text-sm">
          <li
            v-for="tableName in data?.tables ?? []"
            :key="tableName"
            class="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] px-3 py-2 font-mono"
          >
            {{ tableName }}
          </li>
        </ul>
      </article>

      <article class="data-card">
        <p class="text-sm font-medium">Runtime Config</p>
        <dl class="mt-3 grid gap-2 text-sm">
          <div class="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <dt class="text-[var(--muted)]">App Name</dt>
            <dd>{{ runtimeConfig.public.appName }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <dt class="text-[var(--muted)]">Owner Username</dt>
            <dd>{{ runtimeConfig.public.ownerUsername }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>
