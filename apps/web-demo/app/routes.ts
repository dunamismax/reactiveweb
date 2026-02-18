import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("api/auth/*", "routes/api-auth.ts"),
  route("invite/:token", "routes/invite.$token.tsx"),
  layout("routes/dashboard-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("dashboard", "routes/dashboard-redirect.ts"),
    route("users", "routes/users.tsx"),
    route("users/:id", "routes/user-detail.tsx"),
    route("activity", "routes/activity.tsx"),
    route("activity/export.csv", "routes/activity-export.csv.ts"),
    route("auth", "routes/auth.tsx"),
    route("stack", "routes/stack.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
