export interface ApiErrorResponse {
  error: {
    message: string
    code?: string
    details?: Record<string, any>
  }
}

export interface ApiValidationErrorResponse extends ApiErrorResponse {
  error: {
    message: string
    code: 'VALIDATION_ERROR'
    details: {
      field: string
      rule: string
      message: string
    }[]
  }
}

export const createErrorResponse = (
  message: string,
  code?: string,
  details?: Record<string, any>
): ApiErrorResponse => ({
  error: {
    message,
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
  },
})

export const createValidationErrorResponse = (
  errors: { field: string; rule: string; message: string }[]
): ApiValidationErrorResponse => ({
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors,
  },
})

// Common error codes
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
