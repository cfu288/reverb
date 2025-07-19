import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import { createErrorResponse, createValidationErrorResponse } from '../types/api_response.js'
import logger from '@adonisjs/core/services/logger'
import { HttpError } from '@adonisjs/core/types/http'

interface ValidationError {
  field: string
  rule: string
  message: string
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction
  protected renderStatusPages = false // We want JSON responses always

  protected ignoreStatuses = [400, 401, 403, 404, 422] // Don't report common HTTP errors

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // Handle validation errors from VineJS
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send(
        createValidationErrorResponse(
          error.messages.map((m: ValidationError) => ({
            field: m.field,
            rule: m.rule,
            message: m.message,
          }))
        )
      )
    }

    // Handle our custom business logic errors
    if (error instanceof Error) {
      const status = (error as any).status || 500
      const code = (error as any).code || 'E_INTERNAL_SERVER_ERROR'

      return ctx.response.status(status).send(createErrorResponse(error.message, code))
    }

    return super.handle(error, ctx)
  }

  protected context(ctx: HttpContext) {
    return {
      url: ctx.request.url(),
      method: ctx.request.method(),
      userId: ctx.auth?.user?.id,
      requestId: ctx.request.id(),
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
    }
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    if (this.shouldReport(error as HttpError)) {
      const context = this.context(ctx)
      logger.error({ err: error, ...context }, (error as Error)?.message || 'An error occurred')
    }
  }
}
