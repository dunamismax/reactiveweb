import { redirect } from "react-router";

export function loader() {
  throw redirect("/");
}

export default function DashboardRedirectRoute() {
  return null;
}
