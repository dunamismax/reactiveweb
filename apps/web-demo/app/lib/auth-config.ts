import type { AuthConfig } from "@auth/core";

import { signInInputSchema } from "./models";

export const demoAuthConfig: AuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [],
};

export const demoCredentialsHint = {
  email: "ari@reactiveweb.dev",
  password: "demo-pass-123",
};

export function validateSignInPayload(input: unknown) {
  return signInInputSchema.safeParse(input);
}
