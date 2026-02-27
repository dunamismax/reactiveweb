export type SessionUser = {
  id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  name: string;
  username: string;
  mustChangePassword: boolean;
};

export type SessionState = {
  isAuthenticated: boolean;
  currentUserName: string;
  userCount: number;
  user: SessionUser | null;
};

const emptyState: SessionState = {
  isAuthenticated: false,
  currentUserName: "Visitor Session",
  userCount: 0,
  user: null,
};

export function useSession() {
  const session = useState<SessionState>("session-state", () => ({ ...emptyState }));

  async function refresh() {
    try {
      const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
      const next = await $fetch<SessionState>("/api/auth/session", { headers });
      session.value = next;
    } catch {
      session.value = { ...emptyState };
    }

    return session.value;
  }

  async function signOut() {
    const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
    await $fetch("/api/auth/sign-out", { method: "POST", headers }).catch(() => null);
    await refresh();
  }

  return {
    session,
    refresh,
    signOut,
  };
}
