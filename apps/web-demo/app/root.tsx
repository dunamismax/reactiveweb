import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { DemoStoreProvider } from "./lib/demo-store";

export const meta: Route.MetaFunction = () => [
  { title: "ReactiveWeb Web Demo" },
  {
    name: "description",
    content:
      "Flagship ReactiveWeb app demonstrating Bun, React Router, Tailwind, Auth.js patterns, Drizzle schema contracts, and Zod validation.",
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
        <DemoStoreProvider>{children}</DemoStoreProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
