export type ServerErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type ServerErrorPayload = {
  ok: false;
  error: {
    code: ServerErrorCode;
    message: string;
  };
};

export type ServerSuccessPayload<T extends object> = { ok: true } & T;

export function errorPayload(code: ServerErrorCode, message: string): ServerErrorPayload {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

export function throwRouteError(status: number, code: ServerErrorCode, message: string): never {
  throw Response.json(errorPayload(code, message), { status });
}
