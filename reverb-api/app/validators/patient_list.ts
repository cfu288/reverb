import vine from '@vinejs/vine'

/**
 * Validator for patient list creation requests.
 * Ensures that the required fields are present and properly formatted.
 *
 * Validation rules:
 * - display_name: Required string between 1-255 characters
 * - url_safe_name: Required string between 1-255 characters, must contain only lowercase letters, numbers, and hyphens
 * - is_public: Optional boolean, defaults to true
 */
export const createPatientListValidator = vine.compile(
  vine.object({
    display_name: vine.string().trim().minLength(1).maxLength(255),
    url_safe_name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .regex(/^[a-z0-9-]+$/),
    is_public: vine.boolean().optional(),
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
    }),
  })
)

/**
 * Validator for URL parameters in patient list routes.
 * Ensures that the tenant and patient list parameters are properly formatted.
 */
export const patientListParamsValidator = vine.compile(
  vine.object({
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
      url_safe_name: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
    }),
  })
)

/**
 * Validator for tenant URL parameter only.
 * Used in routes that only need tenant validation.
 */
export const tenantParamValidator = vine.compile(
  vine.object({
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
    }),
  })
)
