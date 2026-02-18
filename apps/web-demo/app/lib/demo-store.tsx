import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { demoCredentialsHint, validateSignInPayload } from "./auth-config";
import { initialDemoState } from "./demo-data";
import {
  createUserInputSchema,
  type DemoState,
  demoUserSchema,
  type Role,
  type UserStatus,
} from "./models";

const STORAGE_KEY = "reactiveweb:web-demo:state";

type SignInResult = {
  ok: boolean;
  error?: string;
};

type DemoStore = {
  state: DemoState;
  currentUserName: string;
  signIn: (input: { email: string; password: string }) => SignInResult;
  signOut: () => void;
  addUser: (input: { name: string; email: string; role: Role }) => SignInResult;
  cycleRole: (userId: string) => void;
  setStatus: (userId: string, status: UserStatus) => void;
};

const DemoStoreContext = createContext<DemoStore | null>(null);

const roles: Role[] = ["viewer", "editor", "admin", "owner"];

function nextRole(current: Role): Role {
  const index = roles.indexOf(current);
  return roles[(index + 1) % roles.length] ?? "viewer";
}

function loadFromStorage(): DemoState {
  if (typeof window === "undefined") {
    return initialDemoState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialDemoState;
  }

  try {
    const parsed = JSON.parse(raw) as DemoState;
    const users = parsed.users.map((user) => demoUserSchema.parse(user));
    return {
      ...parsed,
      users,
      authenticatedUserId:
        users.find((user) => user.id === parsed.authenticatedUserId)?.id ?? users[0]?.id ?? null,
    };
  } catch {
    return initialDemoState;
  }
}

function persistState(nextState: DemoState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }
}

export function DemoStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DemoState>(() => loadFromStorage());

  const updateState = useCallback((updater: (previous: DemoState) => DemoState) => {
    setState((previous) => {
      const nextState = updater(previous);
      persistState(nextState);
      return nextState;
    });
  }, []);

  const signIn = useCallback(
    (input: { email: string; password: string }): SignInResult => {
      const parsed = validateSignInPayload(input);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid sign-in payload." };
      }

      const matchingUser = state.users.find((user) => user.email === parsed.data.email);
      if (!matchingUser) {
        return { ok: false, error: "Account not found in demo workspace." };
      }

      if (parsed.data.password !== demoCredentialsHint.password) {
        return { ok: false, error: "Incorrect demo password." };
      }

      updateState((previous) => ({
        ...previous,
        authenticatedUserId: matchingUser.id,
        activity: [
          {
            id: crypto.randomUUID(),
            actor: matchingUser.name,
            action: "Signed in",
            target: "dashboard",
            createdAt: new Date().toISOString(),
          },
          ...previous.activity,
        ].slice(0, 12),
      }));

      return { ok: true };
    },
    [state.users, updateState],
  );

  const signOut = useCallback(() => {
    updateState((previous) => ({
      ...previous,
      authenticatedUserId: null,
      activity: [
        {
          id: crypto.randomUUID(),
          actor: "System",
          action: "Cleared",
          target: "active session",
          createdAt: new Date().toISOString(),
        },
        ...previous.activity,
      ].slice(0, 12),
    }));
  }, [updateState]);

  const addUser = useCallback(
    (input: { name: string; email: string; role: Role }): SignInResult => {
      const parsed = createUserInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid user payload." };
      }

      const alreadyExists = state.users.some(
        (user) => user.email.toLowerCase() === parsed.data.email.toLowerCase(),
      );
      if (alreadyExists) {
        return { ok: false, error: "A user with this email already exists." };
      }

      const now = new Date().toISOString();
      const newUser = demoUserSchema.parse({
        id: crypto.randomUUID(),
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        status: "active",
        createdAt: now,
        lastSeenAt: now,
      });

      updateState((previous) => ({
        ...previous,
        users: [newUser, ...previous.users],
        activity: [
          {
            id: crypto.randomUUID(),
            actor:
              previous.users.find((user) => user.id === previous.authenticatedUserId)?.name ??
              "Admin",
            action: "Created",
            target: `user ${newUser.email}`,
            createdAt: now,
          },
          ...previous.activity,
        ].slice(0, 12),
      }));

      return { ok: true };
    },
    [state.users, updateState],
  );

  const cycleRole = useCallback(
    (userId: string) => {
      updateState((previous) => ({
        ...previous,
        users: previous.users.map((user) =>
          user.id === userId ? { ...user, role: nextRole(user.role) } : user,
        ),
      }));
    },
    [updateState],
  );

  const setStatus = useCallback(
    (userId: string, status: UserStatus) => {
      updateState((previous) => ({
        ...previous,
        users: previous.users.map((user) => (user.id === userId ? { ...user, status } : user)),
      }));
    },
    [updateState],
  );

  const currentUserName =
    state.users.find((user) => user.id === state.authenticatedUserId)?.name ?? "Visitor Session";

  const value = useMemo<DemoStore>(
    () => ({
      state,
      currentUserName,
      signIn,
      signOut,
      addUser,
      cycleRole,
      setStatus,
    }),
    [addUser, currentUserName, cycleRole, setStatus, signIn, signOut, state],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const store = useContext(DemoStoreContext);
  if (!store) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }

  return store;
}
