import type { H3Event } from "h3";
import { setResponseStatus } from "h3";

export function errorPayload(event: H3Event, statusCode: number, code: string, message: string) {
  setResponseStatus(event, statusCode);
  return {
    ok: false as const,
    error: {
      code,
      message,
    },
  };
}
