import type { ActivityEvent, DemoState, DemoUser } from "./models";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const seededUsers: DemoUser[] = [
  {
    id: "f9f0774a-b8d8-4ca3-8e2f-da5f6b35f418",
    name: "Ari Quinn",
    email: "ari@reactiveweb.dev",
    role: "owner",
    status: "active",
    createdAt: hoursAgo(400),
    lastSeenAt: hoursAgo(1),
  },
  {
    id: "f6a8f772-5a3c-460d-a52b-e4be8128e9ee",
    name: "Rae Sullivan",
    email: "rae@reactiveweb.dev",
    role: "admin",
    status: "active",
    createdAt: hoursAgo(340),
    lastSeenAt: hoursAgo(4),
  },
  {
    id: "ea043bc1-f664-4d41-a4ce-778f51053bb5",
    name: "Jules Park",
    email: "jules@reactiveweb.dev",
    role: "editor",
    status: "active",
    createdAt: hoursAgo(280),
    lastSeenAt: hoursAgo(16),
  },
  {
    id: "8ed5c8a8-f6d1-4068-9ea2-9ad3b124e5ec",
    name: "Mina Flores",
    email: "mina@reactiveweb.dev",
    role: "viewer",
    status: "suspended",
    createdAt: hoursAgo(220),
    lastSeenAt: hoursAgo(72),
  },
];

const seededActivity: ActivityEvent[] = [
  {
    id: "event-1",
    actor: "Ari Quinn",
    action: "Published",
    target: "Q1 growth dashboard",
    createdAt: hoursAgo(2),
  },
  {
    id: "event-2",
    actor: "Rae Sullivan",
    action: "Invited",
    target: "new editor account",
    createdAt: hoursAgo(5),
  },
  {
    id: "event-3",
    actor: "System",
    action: "Rotated",
    target: "session signing key",
    createdAt: hoursAgo(11),
  },
];

export const initialDemoState: DemoState = {
  initializedAt: new Date().toISOString(),
  authenticatedUserId: seededUsers[0]?.id ?? null,
  users: seededUsers,
  activity: seededActivity,
};
