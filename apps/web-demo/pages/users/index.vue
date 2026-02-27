<script setup lang="ts">
definePageMeta({ middleware: "require-auth" });

type UserRow = {
  id: string;
  name: string;
  username: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "suspended";
  mustChangePassword: boolean;
  createdAt: string;
  lastSeenAt: string;
};

const { data, refresh: refreshUsers } = await useFetch<{
  ok: boolean;
  users: UserRow[];
  error?: { message: string };
}>("/api/users", {
  headers: process.server ? useRequestHeaders(["cookie"]) : undefined,
});

const createForm = reactive({
  name: "",
  username: "",
  role: "viewer",
  password: "",
  confirmPassword: "",
});

const search = ref("");
const feedback = ref<{ message: string; error: boolean } | null>(null);
const loadingAction = ref(false);

const users = computed(() => (data.value?.ok ? data.value.users : []));

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return users.value;

  return users.value.filter(
    (user) =>
      user.name.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q) ||
      user.status.toLowerCase().includes(q),
  );
});

function roleTone(role: UserRow["role"]) {
  return role;
}

async function createUser() {
  feedback.value = null;
  loadingAction.value = true;

  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      "/api/users",
      {
        method: "POST",
        body: createForm,
      },
    );

    if (!result.ok) {
      feedback.value = { message: result.error?.message ?? "Unable to create user.", error: true };
      return;
    }

    feedback.value = { message: result.message ?? "User created.", error: false };
    createForm.name = "";
    createForm.username = "";
    createForm.role = "viewer";
    createForm.password = "";
    createForm.confirmPassword = "";
    await refreshUsers();
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Unable to create user."), error: true };
  } finally {
    loadingAction.value = false;
  }
}

async function cycleRole(userId: string) {
  loadingAction.value = true;
  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      `/api/users/${userId}/cycle-role`,
      {
        method: "POST",
      },
    );
    feedback.value = {
      message: result.ok
        ? (result.message ?? "Role updated.")
        : (result.error?.message ?? "Role update failed."),
      error: !result.ok,
    };
    await refreshUsers();
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Role update failed."), error: true };
  } finally {
    loadingAction.value = false;
  }
}

async function toggleStatus(userId: string) {
  loadingAction.value = true;
  try {
    const result = await $fetch<{ ok: boolean; message?: string; error?: { message: string } }>(
      `/api/users/${userId}/toggle-status`,
      {
        method: "POST",
      },
    );
    feedback.value = {
      message: result.ok
        ? (result.message ?? "Status updated.")
        : (result.error?.message ?? "Status update failed."),
      error: !result.ok,
    };
    await refreshUsers();
  } catch (error: unknown) {
    feedback.value = { message: getApiErrorMessage(error, "Status update failed."), error: true };
  } finally {
    loadingAction.value = false;
  }
}
</script>

<template>
  <section>
    <SectionHeader
      caption="User Management"
      title="Team Access Controls"
      description="Create users, rotate roles, and suspend access with server-enforced authorization rules."
    />

    <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <article class="data-card">
        <p class="text-sm font-medium">Create User</p>
        <form class="mt-3 grid gap-3" @submit.prevent="createUser">
          <input v-model="createForm.name" class="input" placeholder="Display name" required type="text" />
          <input v-model="createForm.username" class="input" placeholder="username" required type="text" />
          <select v-model="createForm.role" class="input">
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>
          <input v-model="createForm.password" class="input" minlength="8" placeholder="Password" required type="password" />
          <input
            v-model="createForm.confirmPassword"
            class="input"
            minlength="8"
            placeholder="Confirm password"
            required
            type="password"
          />
          <button class="btn btn-primary" :disabled="loadingAction" type="submit">Create User</button>
        </form>
      </article>

      <article class="data-card overflow-x-auto">
        <div class="mb-3 flex items-center gap-2">
          <input v-model="search" class="input" placeholder="Search users..." type="search" />
          <button class="btn btn-muted" type="button" @click="refreshUsers()">Refresh</button>
        </div>

        <table class="table min-w-[620px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <NuxtLink class="font-medium hover:underline" :to="`/users/${user.id}`">{{ user.name }}</NuxtLink>
                <p class="text-xs text-[var(--muted)]">@{{ user.username }}</p>
              </td>
              <td>
                <BadgePill :tone="roleTone(user.role)">{{ user.role }}</BadgePill>
              </td>
              <td>
                <BadgePill :tone="user.status === 'active' ? 'success' : 'warning'">{{ user.status }}</BadgePill>
              </td>
              <td class="text-xs text-[var(--muted)]">{{ new Date(user.lastSeenAt).toLocaleString() }}</td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <button class="btn btn-muted" :disabled="loadingAction" type="button" @click="cycleRole(user.id)">
                    Cycle Role
                  </button>
                  <button class="btn" :class="user.status === 'active' ? 'btn-danger' : 'btn-muted'" :disabled="loadingAction" type="button" @click="toggleStatus(user.id)">
                    {{ user.status === "active" ? "Suspend" : "Activate" }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length">
              <td class="text-sm text-[var(--muted)]" colspan="5">No users found.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>

    <p v-if="feedback" class="mt-3 text-sm" :class="feedback.error ? 'text-[var(--tone-error-fg)]' : 'text-[var(--tone-success-fg)]'">
      {{ feedback.message }}
    </p>
  </section>
</template>
