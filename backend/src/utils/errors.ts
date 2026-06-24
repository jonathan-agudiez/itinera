export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(message = 'Recurso no encontrado'): never {
  throw new AppError(404, 'NOT_FOUND', message);
}

export function forbidden(message = 'No tienes permiso para realizar esta acción'): never {
  throw new AppError(403, 'FORBIDDEN', message);
}

export function unauthorized(message = 'Debes iniciar sesión para continuar'): never {
  throw new AppError(401, 'UNAUTHORIZED', message);
}
