import { signInInputSchema } from "./models";

export const demoAuthUiConfig = {
  sessionStrategy: "jwt",
  signInRoute: "/auth",
  authBasePath: "/api/auth",
  signInCallbackPath: "/auth?status=signed-in",
  signOutCallbackPath: "/auth?status=signed-out",
} as const;

export function validateSignInPayload(input: unknown) {
  return signInInputSchema.safeParse(input);
}

export function sanitizeCallbackPath(
  input: FormDataEntryValue | null | undefined,
  fallback: string,
) {
  if (typeof input !== "string" || input.length === 0) return fallback;

  try {
    const url = new URL(input, "http://reactiveweb.local");
    if (url.origin !== "http://reactiveweb.local") return fallback;
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
