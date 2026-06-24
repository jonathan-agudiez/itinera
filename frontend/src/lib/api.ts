const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | T
    | null;

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? 'The request could not be completed',
      error?.details,
    );
  }

  return payload as T;
}

export function jsonBody(value: unknown): Pick<RequestInit, 'body'> {
  return { body: JSON.stringify(value) };
}
