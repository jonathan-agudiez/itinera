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

export function notFound(message = 'Resource not found'): never {
  throw new AppError(404, 'NOT_FOUND', message);
}

export function forbidden(message = 'You do not have permission to perform this action'): never {
  throw new AppError(403, 'FORBIDDEN', message);
}

export function unauthorized(message = 'Authentication required'): never {
  throw new AppError(401, 'UNAUTHORIZED', message);
}
