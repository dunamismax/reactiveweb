import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { RouteErrorPanel } from "./components/route-error-panel";
import { ToastProvider } from "./components/toast";
import "./app.css";

export const meta: Route.MetaFunction = () => [
  { title: "ReactiveWeb Web Demo" },
  {
    name: "description",
    content:
      "Flagship ReactiveWeb app demonstrating Node.js, pnpm, React Router, Tailwind, Auth.js patterns, Drizzle schema contracts, and Zod validation.",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}

export function ErrorBoundary() {
  return (
    <Layout>
      <main className="mx-auto max-w-[900px] p-6">
        <RouteErrorPanel title="Application Error" />
      </main>
    </Layout>
  );
}
