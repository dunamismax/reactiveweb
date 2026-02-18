import { AppShell } from "~/components/app-shell";
import { RouteErrorPanel } from "~/components/route-error-panel";
import { getLayoutSessionState } from "~/lib/demo-state.server";
import type { Route } from "./+types/dashboard-layout";

export async function loader({ request }: Route.LoaderArgs) {
  return getLayoutSessionState(request);
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return <AppShell currentUserName={loaderData.currentUserName} userCount={loaderData.userCount} />;
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto max-w-[900px] p-6">
      <RouteErrorPanel title="Route Error" />
    </div>
  );
}
