<script setup lang="ts">
defineProps<{
  caption: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <header>
    <p class="small-label">{{ caption }}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight">{{ title }}</h1>
    <p class="mt-2 max-w-3xl text-sm text-[var(--muted)]">{{ description }}</p>
  </header>
</template>
