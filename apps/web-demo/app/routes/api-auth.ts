import { authHandler } from "~/lib/auth.server";

export async function loader({ request }: { request: Request }) {
  return authHandler(request);
}

export async function action({ request }: { request: Request }) {
  return authHandler(request);
}
