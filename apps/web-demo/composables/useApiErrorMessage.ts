type ApiErrorShape = {
  error?: {
    message?: string;
  };
  message?: string;
  statusMessage?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: ApiErrorShape }).data;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (data?.message) {
      return data.message;
    }
    if (data?.statusMessage) {
      return data.statusMessage;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
