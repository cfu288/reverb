import vine from '@vinejs/vine'

/**
 * Validator for tenant URL parameter.
 * Ensures that the tenant parameter is properly formatted.
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

/**
 * Validator for tenant creation/update requests.
 * Ensures that the required fields are present and properly formatted.
 */
export const tenantValidator = vine.compile(
  vine.object({
    display_name: vine.string().trim().minLength(1).maxLength(255),
    url_safe_name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .regex(/^[a-z0-9-]+$/),
  })
)
