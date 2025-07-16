import type User from '#models/user'
import type Tenant from '#models/tenant'
import type PatientList from '#models/patient_list'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * PatientListPolicy handles authorization for patient list operations.
 * All operations are scoped to a tenant (organization) and require specific permissions.
 * Users can only access patient lists within tenants they belong to.
 *
 * For private lists:
 * - Only members can view the list
 * - Only the creator can delete the list
 * - Only members can add/remove patients from the list
 * - The creator can add/remove members
 *
 * Exception: Users with PatientList.Read.All or PatientList.Write.All permissions
 * have full access to all lists in their tenant, including private lists.
 * Users with PatientList.Delete.All can delete any list in their tenant.
 */
export default class PatientListPolicy extends BasePolicy {
  /**
   * Helper method to check if a user has admin-level permissions
   */
  private async hasAdminPermissions(
    user: User,
    tenant: Tenant,
    type: 'Read' | 'Write' | 'Delete'
  ): Promise<boolean> {
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', tenant.id)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    return permissions.some((permission) => permission.name === `PatientList.${type}.All`)
  }

  /**
   * Determines if a user can create a patient list in a specific tenant.
   *
   * @param user - The user attempting to create the list
   * @param tenant - The tenant (organization) where the list will be created
   * @returns true if the user has either PatientList.Write or PatientList.Write.All permission in the tenant
   *
   * Required Permissions:
   * - PatientList.Write: Can create patient lists
   * - PatientList.Write.All: Can create patient lists (admin level)
   */
  async create(user: User, tenant: Tenant) {
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', tenant.id)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    return permissions.some(
      (permission) =>
        permission.name === 'PatientList.Write' || permission.name === 'PatientList.Write.All'
    )
  }

  /**
   * Determines if a user can view a specific patient list.
   * For public lists: User must belong to the tenant and have read permissions
   * For private lists: User must be a member of the list, its creator, or have admin permissions
   *
   * @param user - The user attempting to view the list
   * @param patientList - The patient list being accessed
   * @returns true if the user has appropriate access
   *
   * Required Permissions:
   * - PatientList.Read: Can view public patient lists
   * - PatientList.Read.All: Can view all patient lists (including private ones)
   */
  async view(user: User, patientList: PatientList) {
    // First verify the user belongs to the tenant
    const userTenant = await patientList
      .related('tenant')
      .query()
      .whereHas('users', (query) => {
        query.where('users.id', user.id)
      })
      .first()

    if (!userTenant) {
      return false
    }

    // Check for admin access first
    if (await this.hasAdminPermissions(user, userTenant, 'Read')) {
      return true
    }

    // For private lists, check membership
    if (!patientList.isPublic) {
      await patientList.load('members')
      return (
        patientList.createdByUserId === user.id ||
        patientList.members.some((member) => member.id === user.id)
      )
    }

    // For public lists, check permissions
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', patientList.tenantId)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    return permissions.some(
      (permission) =>
        permission.name === 'PatientList.Read' || permission.name === 'PatientList.Read.All'
    )
  }

  /**
   * Determines if a user can delete a specific patient list.
   * Only the creator of a list can delete it, or users with admin delete permissions.
   *
   * @param user - The user attempting to delete the list
   * @param patientList - The patient list being deleted
   * @returns true if the user is the creator or has admin delete permissions
   *
   * Required Permissions:
   * - PatientList.Delete: Can delete lists they created
   * - PatientList.Delete.All: Can delete any list in the tenant
   */
  async delete(user: User, patientList: PatientList) {
    const tenant = await patientList.related('tenant').query().firstOrFail()

    // Check for admin delete permissions first
    if (await this.hasAdminPermissions(user, tenant, 'Delete')) {
      return true
    }

    // Check if user is the creator and has basic delete permission
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', tenant.id)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    const hasDeletePermission = permissions.some(
      (permission) =>
        permission.name === 'PatientList.Delete' || permission.name === 'PatientList.Delete.All'
    )

    return patientList.createdByUserId === user.id && hasDeletePermission
  }

  /**
   * Determines if a user can list patient lists in a tenant.
   * This method only checks if the user has permission to LIST lists.
   * The actual filtering of which lists are visible is handled by the service layer.
   *
   * The service layer will:
   * - Show all public lists if user has PatientList.Read
   * - Show private lists they created
   * - Show private lists where they are a member
   * - Show all lists (public and private) if they have PatientList.Read.All
   *
   * @param user - The user attempting to list patient lists
   * @param tenant - The tenant whose lists are being accessed
   * @returns true if the user has appropriate read permissions in the tenant
   *
   * Required Permissions:
   * - PatientList.Read: Required to list any lists (will only see public lists and private lists they have access to)
   * - PatientList.Read.All: Can see all lists (public and private)
   */
  async all(user: User, tenant: Tenant) {
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', tenant.id)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)

    // User needs at least basic read permission to list any lists
    return permissions.some(
      (permission) =>
        permission.name === 'PatientList.Read' || permission.name === 'PatientList.Read.All'
    )
  }

  /**
   * Determines if a user can manage members of a private list.
   * Only the creator can add/remove members, or users with admin write permissions.
   *
   * @param user - The user attempting to manage members
   * @param patientList - The patient list being modified
   * @returns true if the user is the creator or has admin permissions
   */
  async manageMembers(user: User, patientList: PatientList) {
    return (
      patientList.createdByUserId === user.id ||
      (await this.hasAdminPermissions(
        user,
        await patientList.related('tenant').query().firstOrFail(),
        'Write'
      ))
    )
  }

  /**
   * Determines if a user can manage patients in a list.
   * For public lists: User must have write permissions
   * For private lists: User must be a member, creator, or have admin permissions
   *
   * @param user - The user attempting to manage patients
   * @param patientList - The patient list being modified
   * @returns true if the user has appropriate access
   *
   * Required Permissions:
   * - PatientList.Write: Can modify public patient lists
   * - PatientList.Write.All: Can modify all patient lists (including private ones)
   */
  async managePatients(user: User, patientList: PatientList) {
    // Check for admin access first
    const tenant = await patientList.related('tenant').query().firstOrFail()
    if (await this.hasAdminPermissions(user, tenant, 'Write')) {
      return true
    }

    // For private lists, check membership
    if (!patientList.isPublic) {
      await patientList.load('members')
      return (
        patientList.createdByUserId === user.id ||
        patientList.members.some((member) => member.id === user.id)
      )
    }

    // For public lists, check permissions
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', patientList.tenantId)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    return permissions.some(
      (permission) =>
        permission.name === 'PatientList.Write' || permission.name === 'PatientList.Write.All'
    )
  }
}
