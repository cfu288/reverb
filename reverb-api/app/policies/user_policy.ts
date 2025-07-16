import Tenant from '#models/tenant'
import User from '#models/user'
import { CreateUserData } from '#services/user_service'

import { BasePolicy } from '@adonisjs/bouncer'

/**
 * UserPolicy handles authorization for user operations within tenants.
 * It enforces tenant boundaries and role-based permissions for user management.
 *
 * Key behaviors:
 * 1. Self-Registration:
 *    - Allowed without authentication when no tenant is specified
 *    - User gets their own tenant and becomes its admin
 *
 * 2. User Creation in Existing Tenants:
 *    - Requires authentication
 *    - Creator must have User.Write.All permission
 *    - Creator must belong to the target tenant
 *
 * 3. User Viewing:
 *    - Users can view their own profile with User.Read permission
 *    - Viewing other users requires User.Read.All permission
 *    - All operations are tenant-scoped
 */
export default class UserPolicy extends BasePolicy {
  /**
   * Helper method to check if a user has specific permissions in a tenant
   */
  private async hasPermission(
    user: User,
    tenant: Tenant,
    permissionName: string
  ): Promise<boolean> {
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', tenant.id)
      .preload('permissions')

    return roles.some((role) =>
      role.permissions.some((permission) => permission.name === permissionName)
    )
  }

  /**
   * Determines if a user can create another user.
   * @see class documentation for detailed behavior
   */
  async create(user: User | null, userData: Partial<CreateUserData>, tenant: Tenant | null) {
    // Allow self-registration (no tenant specified)
    if (!tenant) {
      return true
    }

    // Deny unauthorized users from creating users in existing tenants
    if (!user) {
      return false
    }

    // Check if user has permission to create users in this tenant
    const hasCreatePermission = await this.hasPermission(user, tenant, 'User.Write.All')
    if (!hasCreatePermission) {
      return false
    }

    // If no role is specified for an existing tenant, use default role
    if (!userData.roleKey) {
      userData.roleKey = 'default_clinician'
    }

    return true
  }

  /**
   * Determines if a user can view another user's information.
   * Users can always view their own profile.
   * Viewing others requires Read.All permission.
   */
  async view(user: User, username: string, tenant: Tenant) {
    // Users can always view their own profile
    if (user.username === username) {
      return true
    }

    // Viewing other users requires Read.All permission
    return this.hasPermission(user, tenant, 'User.Read.All')
  }

  /**
   * Determines if a user can list all users in a tenant.
   * Requires User.Read.All permission.
   */
  async all(user: User, tenant: Tenant) {
    return this.hasPermission(user, tenant, 'User.Read.All')
  }
}
