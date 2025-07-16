import { errors, symbols } from '@adonisjs/auth'
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types'
import jwt from 'jsonwebtoken'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import User from '#models/user'

export type JwtGuardOptions = {
  secret: string
}

/**
 * The bridge between the User provider and the
 * Guard
 */
export type JwtGuardUser<RealUser> = {
  /**
   * Returns the unique ID of the user
   */
  getId(): string | number | BigInt

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export interface JwtUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]: RealUser

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>

  /**
   * Find a user by their id.
   */
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  private ctx: HttpContext
  private userProvider: UserProvider
  private options: JwtGuardOptions

  constructor(ctx: HttpContext, userProvider: UserProvider, options: JwtGuardOptions) {
    this.ctx = ctx
    this.userProvider = userProvider
    this.options = options
  }

  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  /**
   * A unique name for the guard driver
   */
  driverName: 'jwt' = 'jwt'

  /**
   * A flag to know if the authentication was an attempt
   * during the current HTTP request
   */
  authenticationAttempted: boolean = false

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated: boolean = false

  /**
   * Reference to the currently authenticated user
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]

  /**
   * Auth expiration time in seconds (15 minutes)
   */
  authTokenExpiry: number = 15 * 60

  refreshTokenExpiry: number = 48 * 60 * 60

  /**
   * Generate a JWT access, id, and refresh token for a given user.
   * Secured with a fingerprint cookie. The cookie is used to validate the refresh token.
   *
   * The fingerprint is only generated during initial authentication, and is set as a cookie
   * The fingerprint is sent with each request, and is used to validate each request in the future
   * It is used to ensure that stolen tokens can't be replayed, because stolen tokens will not have access to the cookie
   *
   * @see https://hasura.io/blog/best-practices-of-using-jwt-with-graphql
   * @see https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.md#token-storage-on-client-side
   */
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
    options?: { skipRefreshAndIdToken?: boolean }
  ): Promise<{
    token_type: string
    access_token: string
    expires_in: number
    refresh_token?: string
    id_token?: string
  }> {
    const providerUser = await this.userProvider.createUserForGuard(user)

    const userObject = providerUser.getOriginal() as User
    try {
      await userObject.load('roles', (rolesQuery) => {
        rolesQuery.preload('permissions')
      })
    } catch (error) {
      console.log('error', error)
    }

    const fingerprint = await this.generateFingerprintAndSetCookie()

    const accessToken = this.generateAuthToken(providerUser, userObject, fingerprint)
    const response: {
      token_type: string
      access_token: string
      expires_in: number
      refresh_token?: string
      id_token?: string
    } = {
      token_type: 'bearer',
      access_token: accessToken,
      expires_in: this.authTokenExpiry,
    }

    if (!options?.skipRefreshAndIdToken) {
      response.refresh_token = this.generateRefreshToken(providerUser, fingerprint)
      response.id_token = this.generateIdToken(providerUser, userObject)
    }

    return response
  }

  /**
   * Generates a fingerprint, sets it as a cookie, and returns its hashed value.
   *
   * The fingerprint is a unique identifier used to enhance the security of refresh tokens.
   * It is stored as a cookie in the user's browser and its hashed value is embedded in the token claims.
   * During a refresh request, the unhashed value from the HTTP-only cookie is compared with the hashed value in the token claims.
   * If they do not match, the refresh request is rejected. This protects against XSS stealing tokens and replaying them.
   *
   * @returns {Promise<string>} The hashed fingerprint value.
   */
  private async generateFingerprintAndSetCookie(): Promise<string> {
    const fingerprint = Math.random().toString(36).substring(2)
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprint)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const fingerprintHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (env.get('NODE_ENV') === 'development') {
      console.log('DEVELOPMENT COOKIE USED')
      // for development, we can't use secure cookies
      // the non-hashed fingerprint should always be returned
      // the hashed fingerprint will be found in the token
      this.ctx.response.cookie('fingerprint', fingerprint, {
        httpOnly: false,
        sameSite: 'none',
      })
    } else {
      // Set the fingerprint as a HttpOnly cookie
      this.ctx.response.cookie('fingerprint', fingerprint, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })
    }

    return fingerprintHash
  }

  private generateAuthToken(
    providerUser: JwtGuardUser<UserProvider[typeof symbols.PROVIDER_REAL_USER]>,
    userObject: User,
    fingerprint: string
  ): string {
    // time in seconds
    return jwt.sign(
      {
        iss: env.get('SERVER_URL'),
        sub: providerUser.getId(),
        aud: env.get('CLIENT_URL'),
        exp: Math.floor(Date.now() / 1000) + this.authTokenExpiry,
        nbf: Math.floor(Date.now() / 1000),
        jti: Math.random().toString(36).substring(7),
        scope: userObject.roles
          .flatMap((role) => role.permissions.map((permission) => permission.name))
          .join(' '),
        role: userObject.roles.map((role) => role.name).join(' '),
        fingerprint: fingerprint,
      },
      this.options.secret
    )
  }

  private generateRefreshToken(
    providerUser: JwtGuardUser<UserProvider[typeof symbols.PROVIDER_REAL_USER]>,
    fingerprint: string
  ): string {
    return jwt.sign(
      {
        iss: env.get('SERVER_URL'),
        sub: providerUser.getId(),
        aud: env.get('CLIENT_URL'),
        exp: Math.floor(Date.now() / 1000) + this.refreshTokenExpiry,
        nbf: Math.floor(Date.now() / 1000),
        jti: Math.random().toString(36).substring(7),
        fingerprint: fingerprint,
      },
      this.options.secret
    )
  }

  private generateIdToken(
    providerUser: JwtGuardUser<UserProvider[typeof symbols.PROVIDER_REAL_USER]>,
    userObject: User
  ): string {
    return jwt.sign(
      {
        iss: env.get('SERVER_URL'),
        sub: providerUser.getId(),
        aud: env.get('CLIENT_URL'),
        exp: Math.floor(Date.now() / 1000) + this.authTokenExpiry,
        nbf: Math.floor(Date.now() / 1000),
        jti: Math.random().toString(36).substring(7),
        name: userObject.username,
        email: userObject.email,
        username: userObject.username,
        first_name: userObject.firstName,
        last_name: userObject.lastName,
      },
      this.options.secret
    )
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    /**
     * Avoid re-authentication when it has been done already
     * for the given request
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }
    this.authenticationAttempted = true

    /**
     * Ensure the auth header exists
     */
    const authHeader = this.ctx.request.header('authorization')
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Split the header value and read the token from it
     */
    const [, token] = authHeader.split('Bearer ')
    if (!token) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Verify token
     */
    const payload = jwt.verify(token, this.options.secret, {
      issuer: env.get('SERVER_URL'),
      audience: env.get('CLIENT_URL'),
    })
    if (typeof payload !== 'object' || !('sub' in payload)) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    // Check the fingerprint
    await this.verifyFingerprint(payload.fingerprint)

    /**
     * Fetch the user by user ID and save a reference to it
     */
    const providerUser = await this.userProvider.findById(payload.sub as string)
    if (!providerUser) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    this.user = providerUser.getOriginal()
    return this.getUserOrFail()
  }

  async checkRefreshToken(): Promise<{ user: any }> {
    try {
      // Get the refresh token from the request
      const refreshToken = this.ctx.request.input('refresh_token')
      if (!refreshToken) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

      // Verify the refresh token
      const payload = jwt.verify(refreshToken, this.options.secret, {
        issuer: env.get('SERVER_URL'),
        audience: env.get('CLIENT_URL'),
      })

      if (typeof payload !== 'object' || !('sub' in payload)) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

      // Check the fingerprint
      await this.verifyFingerprint(payload.fingerprint)

      // Fetch the user by user ID
      const providerUser = await this.userProvider.findById(payload.sub as string)
      if (!providerUser) {
        throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
          guardDriverName: this.driverName,
        })
      }

      return {
        user: providerUser.getOriginal(),
      }
    } catch {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }
  }

  private async verifyFingerprint(tokenFingerprint: string): Promise<void> {
    // Get the fingerprint from the cookie
    const fingerprint = this.ctx.request.cookie('fingerprint')
    if (!fingerprint) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    // Hash the fingerprint from the token payload
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprint)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashedFingerprint = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare the hashed fingerprint with the one in the token
    if (hashedFingerprint !== tokenFingerprint) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }
  }

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    const token = await this.generate(user)
    return {
      headers: {
        authorization: `Bearer ${token.access_token}`,
      },
    }
  }
}
