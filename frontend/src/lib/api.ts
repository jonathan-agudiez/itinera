const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const errorMessages: Record<string, string> = {
  INVALID_ORIGIN: 'El origen de la solicitud no está permitido.',
  CONFLICT: 'Ya existe un registro con esos datos.',
  INTERNAL_ERROR: 'Se ha producido un error inesperado.',
  NOT_FOUND: 'No se ha encontrado el recurso solicitado.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  INVALID_DATE_RANGE: 'El itinerario debe tener una duración de entre 1 y 91 días.',
  ENTRY_OUTSIDE_ITINERARY: 'La fecha de la actividad debe estar dentro del itinerario.',
  EMAIL_EXISTS: 'Ya existe una cuenta con este correo electrónico.',
  CREATE_FAILED: 'No se pudo crear el registro.',
  INVALID_CREDENTIALS: 'El correo electrónico o la contraseña no son correctos.',
  INVALID_RESET_TOKEN: 'El enlace de recuperación no es válido o ha caducado.',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual no es correcta.',
  INVALID_PASSWORD: 'La contraseña no es correcta.',
  UNAUTHORIZED: 'Debes iniciar sesión para continuar.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  CANNOT_DISABLE_SELF: 'No puedes desactivar tu propia cuenta de administrador.',
  CANNOT_DELETE_SELF: 'No puedes eliminar tu propia cuenta de administrador.',
  INVALID_TIME_RANGE: 'La hora de finalización debe ser posterior a la hora de inicio.',
  OWNER_IS_NOT_COLLABORATOR: 'El propietario ya dispone de acceso completo.',
  STALE_ENTRY: 'Otra persona ha modificado esta actividad. Recarga la página e inténtalo de nuevo.',
  REQUEST_FAILED: 'No se pudo completar la solicitud.',
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
};

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', errorMessages.NETWORK_ERROR);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | T
    | null;

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    const code = error?.code ?? 'REQUEST_FAILED';
    throw new ApiError(
      response.status,
      code,
      errorMessages[code] ?? errorMessages.REQUEST_FAILED,
      error?.details,
    );
  }

  return payload as T;
}

export function jsonBody(value: unknown): Pick<RequestInit, 'body'> {
  return { body: JSON.stringify(value) };
}
