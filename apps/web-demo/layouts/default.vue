<script setup lang="ts">
const route = useRoute();
const { session, refresh, signOut } = useSession();
await refresh();

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
  { href: "/stack", label: "Stack" },
];

const isAuthRoute = computed(() => route.path.startsWith("/auth"));

async function handleSignOut() {
  await signOut();
  await navigateTo("/auth?status=signed-out");
}
</script>

<template>
  <div class="min-h-screen">
    <div v-if="!isAuthRoute" class="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header class="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="small-label">ReactiveWeb</p>
            <p class="text-sm text-[var(--muted)]">Nuxt + Vue rewrite of the flagship demo app</p>
          </div>
          <div class="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span>{{ session.currentUserName }}</span>
            <button class="btn btn-muted" type="button" @click="handleSignOut">Sign out</button>
          </div>
        </div>
        <nav class="mt-4 flex flex-wrap gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            class="btn"
            :class="route.path === item.href ? 'btn-primary' : 'btn-muted'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </header>
      <main class="pb-8">
        <slot />
      </main>
    </div>

    <main v-else class="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>
