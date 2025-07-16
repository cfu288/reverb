import vine from '@vinejs/vine'

/**
 * Validates the user's creation action
 */
export const createUserValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(3).alphaNumeric({
      allowSpaces: false,
      allowUnderscores: false,
      allowDashes: true,
    }),
    email: vine.string().trim().email(),
    password: vine.string().trim().minLength(6),
    first_name: vine.string().trim(),
    last_name: vine.string().trim(),
    role_key: vine.string().trim().optional(),
  })
)

/**
 * Validates the user's get action
 */
export const getUserValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(3).alphaNumeric({
      allowSpaces: false,
      allowUnderscores: false,
      allowDashes: true,
    }),
  })
)
