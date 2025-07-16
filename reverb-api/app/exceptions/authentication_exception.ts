import { Exception } from '@adonisjs/core/exceptions'

export default class AuthenticationException extends Exception {
  static status = 401
  static code = 'E_AUTHENTICATION_FAILED'
}
