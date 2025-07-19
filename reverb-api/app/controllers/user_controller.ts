import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import UserPolicy from '#policies/user_policy'
import { TenantService } from '#services/tenant_service'
import { CreateUserData, UserService } from '#services/user_service'
import { createUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import UnauthorizedException from '#exceptions/unauthorized_exception'
import ConflictException from '#exceptions/conflict_exception'

@inject()
export default class UserController {
  constructor(
    protected tenantService: TenantService,
    protected userService: UserService
  ) {}

  /**
   * Create a user, specifically on a tenant. If a user is not specified with a tenant, a default tenant will be generated with the user being a superuser.
   * If a tenant is specified, then a user will be created on that tenant but only if the current user is authorized to create a user with the specified role.
   * @param auth - The authentication service
   * @param bouncer - The authorization service
   * @param request - The request object
   * @param response - The response object
   * @param params - The parameters object
   * @returns The created user
   */
  async create({ auth, bouncer, request, response, params }: HttpContext) {
    const tenantUrlSafeName: string = params.org
    const validatedRequestData = await request.validateUsing(createUserValidator)

    const userData: CreateUserData = {
      username: validatedRequestData.username,
      password: validatedRequestData.password,
      email: validatedRequestData.email,
      firstName: validatedRequestData.first_name,
      lastName: validatedRequestData.last_name,
      roleKey: validatedRequestData.role_key,
    }

    if (tenantUrlSafeName) {
      await auth.authenticate()
      const tenant: Tenant | null =
        await this.tenantService.getTenantByUrlSafeName(tenantUrlSafeName)

      if (!tenant) {
        logger.info(`Tenant not found: ${tenantUrlSafeName}`)
        throw new ResourceNotFoundException('Resource not found')
      }

      if (await bouncer.with(UserPolicy).denies('create', validatedRequestData, tenant)) {
        logger.info(`Unauthorized user creation attempt in tenant: ${tenant.id}`, {
          username: userData.username,
          email: userData.email,
          roleKey: userData.roleKey,
        })
        throw new UnauthorizedException('Not authorized to perform this action')
      }

      userData.tenant = tenant
    }

    try {
      const user = await this.userService.createUser(userData)
      return response.created(user)
    } catch (error) {
      if (error?.code === '23505') {
        // Postgres unique violation
        logger.info('User creation failed - duplicate username or email:', {
          error,
          username: userData.username,
          email: userData.email,
        })
        throw new ConflictException('Unable to create user with provided details')
      }
      throw error
    }
  }

  async view({ auth, bouncer, response, currentTenantPathParam, params }: HttpContext) {
    const currentUser = await auth.authenticate()
    const usernameToSearchFor = params.user
    logger.info(`Viewing user: ${usernameToSearchFor}`)

    if (!currentTenantPathParam || !usernameToSearchFor) {
      logger.info('Missing required parameters:', { currentTenantPathParam, usernameToSearchFor })
      throw new ResourceNotFoundException('Resource not found')
    }

    const tenant: Tenant | null =
      await this.tenantService.getTenantByUrlSafeName(currentTenantPathParam)

    if (!tenant) {
      logger.info(`Tenant not found: ${currentTenantPathParam}`)
      throw new ResourceNotFoundException('Resource not found')
    }

    if (await bouncer.with(UserPolicy).denies('view', usernameToSearchFor, tenant)) {
      logger.info(
        `Unauthorized user view attempt: ${currentUser.username} => ${usernameToSearchFor} in tenant ${tenant.id}`
      )
      throw new UnauthorizedException('Not authorized to perform this action')
    }

    const user = await this.userService.getUserByUsernameAndTenant(usernameToSearchFor, tenant, {
      preloadTenants: true,
      preloadRoles: true,
    })
    return response.ok(user)
  }

  //show all users in a tenant, if current user has "User.Read.All" permission
  async all({ auth, bouncer, response, currentTenantPathParam }: HttpContext) {
    await auth.authenticate()

    if (!currentTenantPathParam) {
      logger.info('Missing tenant parameter in users list request')
      throw new ResourceNotFoundException('Resource not found')
    }

    const tenant = await this.tenantService.getTenantByUrlSafeName(currentTenantPathParam)

    if (!tenant) {
      logger.info(`Tenant not found: ${currentTenantPathParam}`)
      throw new ResourceNotFoundException('Resource not found')
    }

    if (await bouncer.with(UserPolicy).denies('all', tenant)) {
      logger.info(`Unauthorized users list attempt in tenant: ${tenant.id}`)
      throw new UnauthorizedException('Not authorized to perform this action')
    }

    const users = await this.userService.getUsersInTenant(tenant)
    return response.ok(users)
  }
}

export interface PostgresError {
  length: number
  name: string
  severity: string
  code: string
  detail: string
  schema: string
  table: string
  constraint: string
  file: string
  line: string
  routine: string
}
