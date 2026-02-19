import { beforeEach, describe, expect, it, vi } from "vitest";

const { VALID_ACTOR_ID, db, demoState } = vi.hoisted(() => {
  const VALID_ACTOR_ID = "79f0e8e6-4603-4711-bdb8-22af87ce756d";

  return {
    VALID_ACTOR_ID,
    db: {
      getDemoUserById: vi.fn(),
      insertDemoAuditLog: vi.fn(async () => null),
      listDemoUsers: vi.fn(async () => []),
      listRecentDemoActivity: vi.fn(async () => []),
      queryDemoActivity: vi.fn(async () => ({ rows: [], total: 0 })),
      getDemoActivityTrend: vi.fn(async () => []),
    },
    demoState: {
      ensureDemoSeeded: vi.fn(async () => null),
      mapDbActivityToEvent: (row) => ({
        id: row.id ?? "e-1",
        actor: row.actorName ?? "System",
        action: row.action ?? "Created",
        target: row.target ?? "user@example.com",
        createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
      }),
      listActivity: vi.fn(async () => ({ rows: [], total: 0 })),
      buildActivityTrend: vi.fn(() => []),
      requireAuthSession: vi.fn(async () => ({
        user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
      })),
    },
  };
});

const mockDemoServerEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
  AUTH_SECRET: "replace-with-16+-char-secret",
  AUTH_DEMO_PASSWORD: "demo-pass-123",
  VITE_DEMO_OWNER_USERNAME: "owner",
};

vi.mock("@reactiveweb/db", () => db);
vi.mock("~/lib/demo-state.server", () => demoState);
vi.mock("../app/lib/demo-state.server", () => demoState);
vi.mock("../app/lib/demo-state.server.ts", () => demoState);
vi.mock("~/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server.ts", () => ({ demoServerEnv: mockDemoServerEnv }));

const { activityQuerySchema } = await import("../app/lib/models");
const activityRoute = await import("../app/routes/activity.tsx");

describe("activityQuerySchema", () => {
  it("applies defaults when params are empty", () => {
    const result = activityQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.action).toBeUndefined();
    expect(result.q).toBeUndefined();
  });

  it("coerces string numbers to integers", () => {
    const result = activityQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("rejects page less than 1", () => {
    const result = activityQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize greater than 100", () => {
    const result = activityQuerySchema.safeParse({ pageSize: "200" });
    expect(result.success).toBe(false);
  });

  it("accepts optional string filters", () => {
    const result = activityQuerySchema.parse({
      action: "Created",
      actor: "Alice",
      q: "workspace",
      from: "2024-01-01",
      to: "2024-12-31",
    });
    expect(result.action).toBe("Created");
    expect(result.actor).toBe("Alice");
    expect(result.q).toBe("workspace");
    expect(result.from).toBe("2024-01-01");
    expect(result.to).toBe("2024-12-31");
  });

  it("treats non-numeric page as invalid", () => {
    const result = activityQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("activity loader", () => {
  beforeEach(() => {
    demoState.listActivity.mockReset();
    demoState.requireAuthSession.mockReset();
    demoState.ensureDemoSeeded.mockReset();

    demoState.listActivity.mockResolvedValue({ rows: [], total: 0 });
    demoState.requireAuthSession.mockResolvedValue({
      user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
    });
    demoState.ensureDemoSeeded.mockResolvedValue(null);
  });

  it("redirects unauthenticated requests", async () => {
    demoState.requireAuthSession.mockRejectedValue(
      new Response(null, { status: 302, headers: { location: "/auth" } }),
    );

    const run = activityRoute.loader({
      request: new Request("http://localhost/activity"),
    });

    await expect(run).rejects.toMatchObject({ status: 302 });
  });

  it("returns page 1 and pageSize 20 by default", async () => {
    const result = await activityRoute.loader({
      request: new Request("http://localhost/activity"),
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(0);
    expect(result.activity).toEqual([]);
  });

  it("passes page and pageSize from URL to listActivity", async () => {
    await activityRoute.loader({
      request: new Request("http://localhost/activity?page=2&pageSize=10"),
    });

    expect(demoState.listActivity).toHaveBeenCalledTimes(1);
    const params = demoState.listActivity.mock.calls[0][0];
    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(10);
  });

  it("forwards action filter when not 'All'", async () => {
    await activityRoute.loader({
      request: new Request("http://localhost/activity?action=Created"),
    });

    expect(demoState.listActivity).toHaveBeenCalledTimes(1);
    const params = demoState.listActivity.mock.calls[0][0];
    expect(params.action).toBe("Created");
  });

  it("omits action from query when action is 'All'", async () => {
    await activityRoute.loader({
      request: new Request("http://localhost/activity?action=All"),
    });

    const params = demoState.listActivity.mock.calls[0][0];
    expect(params.action).toBeUndefined();
  });

  it("forwards q search param", async () => {
    await activityRoute.loader({
      request: new Request("http://localhost/activity?q=workspace"),
    });

    const params = demoState.listActivity.mock.calls[0][0];
    expect(params.q).toBe("workspace");
  });

  it("forwards actor filter as actorName", async () => {
    await activityRoute.loader({
      request: new Request("http://localhost/activity?actor=Alice"),
    });

    const params = demoState.listActivity.mock.calls[0][0];
    expect(params.actorName).toBe("Alice");
  });

  it("returns activity rows and total from listActivity", async () => {
    const mockEvent = {
      id: "event-abc",
      actor: "Owner",
      action: "Created",
      target: "user@example.com",
      createdAt: "2024-06-01T12:00:00.000Z",
    };
    demoState.listActivity.mockResolvedValue({ rows: [mockEvent], total: 1 });

    const result = await activityRoute.loader({
      request: new Request("http://localhost/activity"),
    });

    expect(result.total).toBe(1);
    expect(result.activity).toHaveLength(1);
    expect(result.activity[0].id).toBe("event-abc");
  });

  it("falls back to defaults for invalid page param", async () => {
    const result = await activityRoute.loader({
      request: new Request("http://localhost/activity?page=0"),
    });

    expect(result.page).toBe(1);
  });
});
