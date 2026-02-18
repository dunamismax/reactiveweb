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
  if (typeof input !== "string") return fallback;
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  return input;
}
