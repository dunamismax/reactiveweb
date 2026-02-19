import { Auth, type AuthConfig } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import type { Session } from "@auth/core/types";
import { getDemoUserByUsername, markDemoUserSeen } from "@reactiveweb/db";

import { demoAuthUiConfig, sanitizeCallbackPath, validateSignInPayload } from "./auth-config";
import { demoServerEnv } from "./env.server";
import { verifyPassword } from "./password.server";

type AuthenticatedSession = Session & {
  user?: Session["user"] & {
    id?: string;
    role?: string;
  };
};

const IS_PRODUCTION = demoServerEnv.NODE_ENV === "production";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SESSION_UPDATE_AGE_SECONDS = 60 * 30;

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookieHeader(originalCookie: string | null, setCookies: string[]) {
  const jar = new Map<string, string>();

  if (originalCookie) {
    for (const chunk of originalCookie.split(";")) {
      const [name, ...rest] = chunk.trim().split("=");
      if (!name || rest.length === 0) continue;
      jar.set(name, rest.join("="));
    }
  }

  for (const setCookie of setCookies) {
    const pair = setCookie.split(";")[0];
    const [name, ...rest] = pair.trim().split("=");
    if (!name || rest.length === 0) continue;
    jar.set(name, rest.join("="));
  }

  if (jar.size === 0) return null;

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export const authConfig: AuthConfig = {
  trustHost: true,
  secret: demoServerEnv.AUTH_SECRET,
  basePath: demoAuthUiConfig.authBasePath,
  pages: {
    signIn: demoAuthUiConfig.signInRoute,
  },
  useSecureCookies: IS_PRODUCTION,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  cookies: {
    sessionToken: {
      name: `${IS_PRODUCTION ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: IS_PRODUCTION,
      },
    },
    callbackUrl: {
      name: `${IS_PRODUCTION ? "__Secure-" : ""}authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: IS_PRODUCTION,
      },
    },
    csrfToken: {
      name: `${IS_PRODUCTION ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: IS_PRODUCTION,
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = validateSignInPayload(credentials);
        if (!parsed.success) return null;

        const user = await getDemoUserByUsername(parsed.data.username);
        if (!user || !user.active || !user.passwordHash) return null;
        if (!verifyPassword(parsed.data.password, user.passwordHash)) return null;

        await markDemoUserSeen(user.id);
        return {
          id: user.id,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userWithRole = user as typeof user & { role?: string };
        token.sub = user.id;
        token.role = userWithRole.role;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      (session as AuthenticatedSession).user = {
        ...session.user,
        id: token.sub,
        role: typeof token.role === "string" ? token.role : undefined,
      } as AuthenticatedSession["user"];

      return session;
    },
  },
};

export async function authHandler(request: Request) {
  return Auth(request, authConfig);
}

function withAuthPath(request: Request, pathname: string, search = "") {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = search;
  return url;
}

export async function getAuthSession(request: Request): Promise<AuthenticatedSession | null> {
  const url = withAuthPath(request, `${demoAuthUiConfig.authBasePath}/session`);
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await authHandler(
    new Request(url, {
      method: "GET",
      headers,
    }),
  );

  if (!response.ok) return null;

  const data = (await response.json().catch(() => null)) as AuthenticatedSession | null;
  if (!data || !data.user?.id) return null;

  return data;
}

async function getForwardedCsrfContext(request: Request) {
  const url = withAuthPath(request, `${demoAuthUiConfig.authBasePath}/csrf`);
  const headers = new Headers();
  const originalCookie = request.headers.get("cookie");
  if (originalCookie) {
    headers.set("cookie", originalCookie);
  }

  const response = await authHandler(
    new Request(url, {
      method: "GET",
      headers,
    }),
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as { csrfToken?: string } | null;
  if (!payload?.csrfToken) {
    return null;
  }

  const mergedCookie = mergeCookieHeader(originalCookie, getSetCookieHeaders(response.headers));
  return {
    csrfToken: payload.csrfToken,
    cookieHeader: mergedCookie,
  };
}

export async function forwardAuthFormPost(
  request: Request,
  pathname: string,
  form: URLSearchParams,
  cookieOverride: string | null = null,
) {
  const url = withAuthPath(request, pathname);
  const headers = new Headers({ "content-type": "application/x-www-form-urlencoded" });
  const cookie = cookieOverride ?? request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return authHandler(
    new Request(url, {
      method: "POST",
      headers,
      body: form.toString(),
    }),
  );
}

export async function forwardSignIn(
  request: Request,
  username: string,
  password: string,
  callbackPath: string,
) {
  const csrf = await getForwardedCsrfContext(request);
  if (!csrf) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unable to establish CSRF state.",
        },
      },
      { status: 401 },
    );
  }

  return forwardAuthFormPost(
    request,
    "/api/auth/callback/credentials",
    new URLSearchParams({
      username,
      password,
      csrfToken: csrf.csrfToken,
      callbackUrl: sanitizeCallbackPath(callbackPath, demoAuthUiConfig.signInCallbackPath),
    }),
    csrf.cookieHeader,
  );
}

export async function forwardSignOut(request: Request, callbackPath: string) {
  const csrf = await getForwardedCsrfContext(request);
  if (!csrf) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unable to establish CSRF state.",
        },
      },
      { status: 401 },
    );
  }

  return forwardAuthFormPost(
    request,
    "/api/auth/signout",
    new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: sanitizeCallbackPath(callbackPath, demoAuthUiConfig.signOutCallbackPath),
    }),
    csrf.cookieHeader,
  );
}
