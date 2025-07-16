import vine from '@vinejs/vine'

/**
 * Validator for patient creation requests.
 * Only validates the route parameters, as patient data schema is tenant-specific.
 */
export const createPatientValidator = vine.compile(
  vine.object({
    data: vine.any(),
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
      list: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
    }),
  })
)

/**
 * Validator for patient update requests.
 * Only validates the route parameters, as patient data schema is tenant-specific.
 */
export const updatePatientValidator = vine.compile(
  vine.object({
    data: vine.any(),
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
      id: vine.string().trim().uuid(),
    }),
  })
)

/**
 * Validator for patient view/delete requests.
 * Only requires org and patient ID parameters.
 */
export const patientParamsValidator = vine.compile(
  vine.object({
    params: vine.object({
      org: vine
        .string()
        .trim()
        .minLength(1)
        .maxLength(255)
        .regex(/^[a-z0-9-]+$/),
      id: vine.string().trim().uuid(),
    }),
  })
)
