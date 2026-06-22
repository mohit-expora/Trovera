import { HttpStatus } from '@nestjs/common';

export class AppException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code: string = 'APP_ERROR',
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppException {
  constructor(message = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictError extends AppException {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

export class AuthenticationError extends AppException {
  constructor(message = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppException {
  constructor(message = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, 'AUTHORIZATION_ERROR');
  }
}

export class InvalidTokenError extends AppException {
  constructor(message = 'Token is invalid or has expired') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}

export class ValidationError extends AppException {
  constructor(message = 'Validation failed', details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
  }
}

export class InactiveUserError extends AppException {
  constructor(message = 'This account has been deactivated') {
    super(message, HttpStatus.FORBIDDEN, 'INACTIVE_USER');
  }
}

export class EmailNotVerifiedError extends AppException {
  constructor(message = 'Please verify your email address before logging in') {
    super(message, HttpStatus.FORBIDDEN, 'EMAIL_NOT_VERIFIED');
  }
}

export class BookUnavailableError extends AppException {
  constructor(message = 'This book is not currently available for issue') {
    super(message, HttpStatus.CONFLICT, 'BOOK_UNAVAILABLE');
  }
}
