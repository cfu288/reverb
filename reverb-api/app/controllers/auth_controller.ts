import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import logger from '@adonisjs/core/services/logger'
import AuthenticationException from '#exceptions/authentication_exception'

export default class AuthController {
  async login({ auth, request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    
    // Validate input
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials')
      throw new AuthenticationException('Email or username and password are required')
    }
    
    // Use the auth system's verifyCredentials which checks both username and email
    try {
      const user = await User.verifyCredentials(email, password)
      
      /**
       * Now create a JWT token for user and send it back
       */
      const jwtResponse = await auth.use('jwt').generate(user)
      return response.ok(jwtResponse)
    } catch (error) {
      logger.info('Failed login attempt:', { identifier: email })
      throw new AuthenticationException('Invalid credentials')
    }
  }

  async refresh({ auth, response }: HttpContext) {
    try {
      // Validate the refresh token using the checkRefreshToken method
      const { user } = await auth.use('jwt').checkRefreshToken()

      // Generate a new JWT token for the user
      const jwtResponse = await auth.use('jwt').generate(user, {
        skipRefreshAndIdToken: true,
      })

      return response.ok(jwtResponse)
    } catch (error) {
      logger.info('Token refresh failed:', { error, userId: auth.user?.id })
      throw new AuthenticationException('Authentication required')
    }
  }
}
