import { beforeEach, describe, expect, it, vi } from "vitest";

const { demoState } = vi.hoisted(() => ({
  demoState: {
    ensureDemoSeeded: vi.fn(async () => null),
    listActivity: vi.fn<
      (input: unknown) => Promise<{
        rows: Array<{
          id: string;
          actor: string;
          action: string;
          target: string;
          createdAt: string;
        }>;
        total: number;
      }>
    >(async () => ({ rows: [], total: 0 })),
    requireAuthSession: vi.fn(async () => ({
      user: {
        id: "79f0e8e6-4603-4711-bdb8-22af87ce756d",
        name: "Owner",
        role: "owner",
      },
    })),
  },
}));

vi.mock("~/lib/demo-state.server", () => demoState);

const exportRoute = await import("../app/routes/activity-export.csv");
type ExportLoaderArgs = Parameters<typeof exportRoute.loader>[0];

describe("activity export route", () => {
  beforeEach(() => {
    demoState.ensureDemoSeeded.mockReset();
    demoState.listActivity.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.ensureDemoSeeded.mockResolvedValue(null);
    demoState.listActivity.mockResolvedValue({ rows: [], total: 0 });
    demoState.requireAuthSession.mockResolvedValue({
      user: {
        id: "79f0e8e6-4603-4711-bdb8-22af87ce756d",
        name: "Owner",
        role: "owner",
      },
    });
  });

  it("enforces auth", async () => {
    demoState.requireAuthSession.mockRejectedValue(
      new Response(null, { status: 302, headers: { location: "/auth" } }),
    );

    const run = exportRoute.loader({
      request: new Request("http://localhost/activity/export.csv"),
    } as unknown as ExportLoaderArgs);

    await expect(run).rejects.toMatchObject({ status: 302 });
  });

  it("returns csv payload with download headers", async () => {
    demoState.listActivity.mockResolvedValue({
      rows: [
        {
          id: "e-1",
          actor: "Owner",
          action: "Updated",
          target: 'user,"special"@reactiveweb.dev',
          createdAt: "2026-02-18T10:00:00.000Z",
        },
      ],
      total: 1,
    });

    const response = (await exportRoute.loader({
      request: new Request("http://localhost/activity/export.csv?action=Updated&q=user"),
    } as unknown as ExportLoaderArgs)) as Response;

    expect(response.headers.get("content-disposition")).toBe('attachment; filename="activity.csv"');
    expect(response.headers.get("content-type")).toContain("text/csv");

    const body = await response.text();
    const lines = body.split("\n");
    expect(lines[0]).toBe("id,actor,action,target,timestamp");
    expect(lines[1]).toContain('"user,""special""@reactiveweb.dev"');
    expect(demoState.listActivity).toHaveBeenCalledTimes(1);
    expect(demoState.listActivity.mock.calls[0][0]).toMatchObject({
      page: 1,
      pageSize: 20,
      includeAll: true,
      action: "Updated",
      q: "user",
    });
  });

  it("exports the full filtered dataset regardless of requested page", async () => {
    demoState.listActivity.mockResolvedValue({
      rows: [
        {
          id: "e-1",
          actor: "Owner",
          action: "Updated",
          target: "user a",
          createdAt: "2026-02-18T10:00:00.000Z",
        },
        {
          id: "e-2",
          actor: "Owner",
          action: "Updated",
          target: "user b",
          createdAt: "2026-02-18T10:01:00.000Z",
        },
        {
          id: "e-3",
          actor: "Owner",
          action: "Updated",
          target: "user c",
          createdAt: "2026-02-18T10:02:00.000Z",
        },
      ],
      total: 3,
    });

    const response = (await exportRoute.loader({
      request: new Request(
        "http://localhost/activity/export.csv?page=9&pageSize=1&action=Updated&actor=Owner&q=user",
      ),
    } as unknown as ExportLoaderArgs)) as Response;

    const body = await response.text();
    const lines = body.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain("e-1");
    expect(lines[2]).toContain("e-2");
    expect(lines[3]).toContain("e-3");

    expect(demoState.listActivity).toHaveBeenCalledTimes(1);
    expect(demoState.listActivity.mock.calls[0][0]).toMatchObject({
      page: 1,
      pageSize: 1,
      includeAll: true,
      action: "Updated",
      actorName: "Owner",
      q: "user",
    });
  });
});
