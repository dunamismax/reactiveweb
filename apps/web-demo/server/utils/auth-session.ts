import { createHmac, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, type H3Event, setCookie } from "h3";

import { getActiveDbUser } from "./demo-state";
import { demoServerEnv } from "./env";
import { toRole } from "./models";

const SESSION_COOKIE = "reactiveweb.session-token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionToken = {
  sub: string;
  iat: number;
  exp: number;
};

export type SessionUser = {
  id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  name: string;
  username: string;
  mustChangePassword: boolean;
};

type AuthResult =
  | {
      ok: true;
      user: SessionUser;
    }
  | {
      ok: false;
      statusCode: number;
      code: string;
      message: string;
    };

function sign(value: string) {
  return createHmac("sha256", demoServerEnv.AUTH_SECRET).update(value).digest("base64url");
}

function encode(payload: SessionToken) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decode(token: string): SessionToken | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionToken;
    if (!payload.sub || typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setSession(event: H3Event, userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionToken = {
    sub: userId,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const secure = demoServerEnv.NODE_ENV === "production";

  setCookie(event, SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAuthSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, {
    path: "/",
  });
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) {
    return null;
  }

  const payload = decode(token);
  if (!payload) {
    clearAuthSession(event);
    return null;
  }

  const dbUser = await getActiveDbUser(payload.sub);
  if (!dbUser) {
    clearAuthSession(event);
    return null;
  }

  return {
    id: dbUser.id,
    role: toRole(dbUser.role),
    name: dbUser.name,
    username: dbUser.username,
    mustChangePassword: dbUser.mustChangePassword,
  };
}

export async function requireSession(
  event: H3Event,
  options: { allowPasswordChange?: boolean } = {},
): Promise<AuthResult> {
  const user = await getSessionUser(event);
  if (!user) {
    return {
      ok: false,
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    };
  }

  if (user.mustChangePassword && !options.allowPasswordChange) {
    return {
      ok: false,
      statusCode: 403,
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Password change required before accessing this route.",
    };
  }

  return {
    ok: true,
    user,
  };
}
