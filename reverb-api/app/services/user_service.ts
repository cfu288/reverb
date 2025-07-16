import User from '#models/user'
import Role from '#models/role'
import Tenant from '#models/tenant'
import { TenantService } from '#services/tenant_service'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export type CreateUserData = {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  tenant?: Tenant
  roleKey?: string
}

@inject()
export class UserService {
  constructor(protected tenantService: TenantService) {}

  public async createUser(data: CreateUserData): Promise<User> {
    return await db.transaction(async (trx) => {
      const user = new User()
      user.fill({
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password_hash: data.password,
      })
      user.useTransaction(trx)
      await user.save()
      let tenantToAssociate: Tenant | null
      if (data.tenant) {
        tenantToAssociate = await this.associateWithExistingTenant(user, data.tenant)
      } else {
        tenantToAssociate = await this.createAndAssociateDefaultTenant(user)
      }

      const role = await this.determineRole(tenantToAssociate, data.roleKey)
      await this.assignRoleToUser(user, role)

      return user
    })
  }

  public async getUserByUsername(username: string): Promise<User | null> {
    return User.findBy('username', username)
  }

  public async getUsersInTenant(
    tenant: Tenant,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: User[]; meta: any }> {
    const usersQuery = User.query()
      .whereHas('tenants', (query) => {
        query.where('id', tenant.id)
      })
      .orderBy('id')

    const paginatedUsers = await usersQuery.paginate(page, limit)
    return {
      data: paginatedUsers.all(),
      meta: paginatedUsers.getMeta(),
    }
  }

  public async getUserByUsernameAndTenant(
    username: string,
    tenant: Tenant,
    options?: { preloadTenants?: boolean; preloadRoles?: boolean }
  ): Promise<User | null> {
    const userQuery = User.query()
      .where('username', username)
      .whereHas('tenants', (tenantQuery) => {
        tenantQuery.where('id', tenant.id)
      })

    if (options?.preloadTenants) {
      userQuery.preload('tenants')
    }

    if (options?.preloadRoles) {
      userQuery.preload('roles')
    }

    return userQuery.first()
  }

  /**
   * Determine the role for the user based on the tenant and role key.
   * If a tenant is provided, the user role is determined partially by
   * whether the requesting user has the permission to create a user of
   * that level in the tenant.
   *
   * If no tenant is provided, a default tenant for that user is created
   * and the user is assigned the default_superuser role of their own tenant.
   *
   * @param tenant - The tenant object.
   * @param role_key - The key of the role.
   * @returns The role object or null if no role is found.
   */
  private async determineRole(tenant: Tenant, role_key?: string): Promise<Role> {
    const roleKey = tenant ? role_key || 'default_admin' : 'default_superuser'
    const role = await Role.query()
      .where('roleKey', roleKey)
      .andWhere('tenantId', tenant.id)
      .first()

    if (!role) {
      throw new Error(`Role not found: ${roleKey}`)
    }

    return role
  }

  /**
   * Associate the user with an existing tenant.
   * @param user - The user to associate.
   * @param tenant - The tenant to associate with.
   * @returns The associated tenant.
   */
  private async associateWithExistingTenant(user: User, tenant: Tenant): Promise<Tenant> {
    await user.related('tenants').save(tenant)
    return tenant
  }

  /**
   * Create a default tenant for the user and associate them with it.
   * @param user - The user to associate.
   * @returns The created tenant.
   */
  private async createAndAssociateDefaultTenant(user: User): Promise<Tenant> {
    const tenant = await this.tenantService.createDefaultTenantForUser(user)
    await user.related('tenants').save(tenant)
    return tenant
  }

  /**
   * Assign a role to the user.
   * @param user - The user to assign the role to.
   * @param role - The role to assign.
   */
  private async assignRoleToUser(user: User, role: Role) {
    await user.related('roles').save(role)
  }
}
