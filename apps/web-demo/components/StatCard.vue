<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  trend: string;
}>();
</script>

<template>
  <article class="data-card card-hover">
    <p class="text-xs text-[var(--muted)]">{{ label }}</p>
    <p class="mt-2 text-3xl font-semibold tracking-tight">{{ value }}</p>
    <p class="mt-2 text-xs text-[var(--muted)]">{{ trend }}</p>
  </article>
</template>
