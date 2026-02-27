<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: "default" | "success" | "warning" | "error" | "owner" | "admin" | "editor" | "viewer";
  }>(),
  {
    tone: "default",
  },
);

const toneClass = computed(() => {
  switch (props.tone) {
    case "success":
      return "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]";
    case "warning":
      return "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]";
    case "error":
      return "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]";
    case "owner":
      return "border-[var(--role-owner-border)] bg-[var(--role-owner-bg)] text-[var(--role-owner-fg)]";
    case "admin":
      return "border-[var(--role-admin-border)] bg-[var(--role-admin-bg)] text-[var(--role-admin-fg)]";
    case "editor":
      return "border-[var(--role-editor-border)] bg-[var(--role-editor-bg)] text-[var(--role-editor-fg)]";
    case "viewer":
      return "border-[var(--role-viewer-border)] bg-[var(--role-viewer-bg)] text-[var(--role-viewer-fg)]";
    default:
      return "border-[var(--border)] bg-[var(--overlay-soft)] text-[var(--foreground)]";
  }
});
</script>

<template>
  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs" :class="toneClass">
    <slot />
  </span>
</template>
