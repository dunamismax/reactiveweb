<script setup lang="ts">
const config = useRuntimeConfig();
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
    <section class="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <p class="text-xs tracking-[0.15em] text-[var(--muted)] uppercase">Starter</p>
      <h1 class="mt-2 text-4xl font-semibold tracking-tight">{{ config.public.appName }}</h1>
      <p class="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        This Nuxt template is the baseline for new apps in `reactiveweb`: Vue 3, TypeScript, Tailwind,
        and workspace-shared packages.
      </p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-[var(--border)] p-4">
          <p class="text-sm font-medium">Framework</p>
          <p class="mt-1 text-sm text-[var(--muted)]">Nuxt + Vue Router file routes</p>
        </div>
        <div class="rounded-xl border border-[var(--border)] p-4">
          <p class="text-sm font-medium">Tooling</p>
          <p class="mt-1 text-sm text-[var(--muted)]">Bun workspaces + Biome + TypeScript</p>
        </div>
      </div>
    </section>
  </main>
</template>
