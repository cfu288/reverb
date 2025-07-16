import type User from '#models/user'
import type Tenant from '#models/tenant'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * TenantPolicy handles authorization for tenant (organization) operations.
 * The primary function is to ensure users can only access tenants they belong to.
 *
 * Key behaviors:
 * - Users can only view tenants they are members of
 * - Membership is determined by the users-tenants relationship
 * - No special role permissions are required, just membership
 * - This is the base access check used by other policies
 */
export default class TenantPolicy extends BasePolicy {
  /**
   * Determines if a user can view/access a specific tenant.
   * This is a fundamental check used throughout the application.
   *
   * @param user - The user attempting to access the tenant
   * @param tenant - The tenant being accessed
   * @returns true if the user is a member of the tenant
   */
  async view(user: User, tenant: Tenant) {
    const userTenant = await tenant.related('users').query().where('users.id', user.id).first()
    const hasAccess = !!userTenant

    return hasAccess
  }
}
