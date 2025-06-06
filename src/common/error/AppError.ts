export const ErrorType = {
  USER_EXISTS: "USER_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN: "INVALID_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  BAD_REQUEST: "BAD_REQUEST",
  PARSE_ERROR: "PARSE_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export const errorStatusMap: Record<ErrorType, number> = {
  USER_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  INVALID_TOKEN: 401,
  USER_NOT_FOUND: 404,
  TOKEN_EXPIRED: 401,
  BAD_REQUEST: 400,
  PARSE_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 400,
  INTERNAL_SERVER_ERROR: 500,
};

export const defaultErrorMessages: Record<ErrorType, string> = {
  USER_EXISTS: "User already exists",
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_TOKEN: "Invalid token",
  USER_NOT_FOUND: "User not found",
  TOKEN_EXPIRED: "Token has expired",
  BAD_REQUEST: "Bad request",
  PARSE_ERROR: "Invalid JSON payload",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  CONFLICT: "Resource conflict",
  VALIDATION_ERROR: "Validation failed",
  INTERNAL_SERVER_ERROR: "Internal server error",
};

export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: ErrorType;
    details: Record<string, any>;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details: Record<string, any>;

  constructor(
    public readonly type: ErrorType,
    message?: string,
    details: Record<string, any> = {}
  ) {
    super(message || defaultErrorMessages[type]);
    this.name = this.constructor.name;
    this.statusCode = errorStatusMap[type];
    this.details = details;
  }

  toResponse(): ErrorResponse {
    return {
      success: false,
      message: this.message,
      error: {
        type: this.type,
        details: this.details,
      },
    };
  }

  static create(type: ErrorType, details: Record<string, any> = {}): AppError {
    return new AppError(type, undefined, details);
  }

  static withMessage(
    type: ErrorType,
    message: string,
    details: Record<string, any> = {}
  ): AppError {
    return new AppError(type, message, details);
  }
}

export function throwError(
  type: ErrorType,
  details: Record<string, any> = {}
): never {
  throw AppError.create(type, details);
}

export function throwErrorWithMessage(
  type: ErrorType,
  message: string,
  details: Record<string, any> = {}
): never {
  throw AppError.withMessage(type, message, details);
}
