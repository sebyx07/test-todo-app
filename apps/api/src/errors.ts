// Error hierarchy. Every thrown error is typed and maps to a stable HTTP status.
// Never throw a bare Error.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = 'internal_error') {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'not_found');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'validation_failed');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'conflict');
  }
}
