import type User from '#models/user'
import type Patient from '#models/patient'
import type PatientList from '#models/patient_list'
import { BasePolicy } from '@adonisjs/bouncer'

/**
 * PatientPolicy handles authorization for patient operations.
 * Access to patients is controlled through patient list membership and permissions.
 *
 * Key behaviors:
 * - Users can only access patients in lists they have access to
 * - For private lists, users must be members or have admin permissions
 * - For public lists, users must have appropriate read/write permissions
 * - All operations are scoped to a tenant
 */
export default class PatientPolicy extends BasePolicy {
  /**
   * Helper method to check if a user has admin-level permissions
   */
  private async hasAdminPermissions(
    user: User,
    patientList: PatientList,
    type: 'Read' | 'Write' | 'Delete'
  ): Promise<boolean> {
    const roles = await user
      .related('roles')
      .query()
      .where('tenantId', patientList.tenantId)
      .preload('permissions')
    const permissions = roles.flatMap((role) => role.permissions)
    return permissions.some((permission) => permission.name === `Patient.${type}.All`)
  }

  /**
   * Determines if a user can create a patient in a specific list.
   * For public lists: User must have write permissions
   * For private lists: User must be a member or have admin permissions
   */
  async create(user: User, patientList: PatientList) {
    // Check for admin access first
    if (await this.hasAdminPermissions(user, patientList, 'Write')) {
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
      (permission) => permission.name === 'Patient.Write' || permission.name === 'Patient.Write.All'
    )
  }

  /**
   * Determines if a user can view a specific patient.
   * Access is determined by the patient list's visibility and user's permissions.
   */
  async view(user: User, patient: Patient) {
    await patient.load('patientList')
    const patientList = patient.patientList

    // Check for admin access first
    if (await this.hasAdminPermissions(user, patientList, 'Read')) {
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
      (permission) => permission.name === 'Patient.Read' || permission.name === 'Patient.Read.All'
    )
  }

  /**
   * Determines if a user can update a specific patient.
   * Similar to view but requires write permissions.
   */
  async update(user: User, patient: Patient) {
    await patient.load('patientList')
    const patientList = patient.patientList

    // Check for admin access first
    if (await this.hasAdminPermissions(user, patientList, 'Write')) {
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
      (permission) => permission.name === 'Patient.Write' || permission.name === 'Patient.Write.All'
    )
  }

  /**
   * Determines if a user can delete a specific patient.
   * Similar to update but requires delete permissions.
   */
  async delete(user: User, patient: Patient) {
    await patient.load('patientList')
    const patientList = patient.patientList

    // Check for admin access first
    if (await this.hasAdminPermissions(user, patientList, 'Delete')) {
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
        permission.name === 'Patient.Delete' || permission.name === 'Patient.Delete.All'
    )
  }
}
