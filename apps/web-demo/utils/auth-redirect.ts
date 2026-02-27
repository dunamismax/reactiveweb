export function getSafeAuthRedirectTarget(input: unknown, fallback = "/") {
  if (typeof input !== "string" || input.length === 0) {
    return fallback;
  }

  if (!input.startsWith("/") || input.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(input, "http://reactiveweb.local");
    const target = `${url.pathname}${url.search}${url.hash}`;

    if (target === "/auth" || target.startsWith("/auth?") || target.startsWith("/auth#")) {
      return fallback;
    }

    return target;
  } catch {
    return fallback;
  }
}
