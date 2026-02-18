import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("api/auth/*", "routes/api-auth.ts"),
  layout("routes/dashboard-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("users", "routes/users.tsx"),
    route("auth", "routes/auth.tsx"),
    route("stack", "routes/stack.tsx"),
  ]),
] satisfies RouteConfig;
