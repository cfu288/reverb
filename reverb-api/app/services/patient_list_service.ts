import { inject } from '@adonisjs/core'
import PatientList from '#models/patient_list'
import type Tenant from '#models/tenant'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'

/**
 * Data required to create a new patient list
 */
export type CreatePatientListData = {
  /** Display name of the list shown to users */
  displayName: string
  /** URL-friendly identifier for the list */
  urlSafeName: string
  /** Tenant (organization) that owns the list */
  tenant: Tenant
  /** Whether the list is public within the tenant */
  isPublic: boolean
  /** The user creating the list */
  creator: User
}

/**
 * Service class for managing patient lists.
 * Handles CRUD operations for patient lists, ensuring they are properly scoped to tenants.
 * All operations are performed within database transactions where appropriate.
 */
@inject()
export class PatientListService {
  /**
   * Helper method to check if a user has admin-level permissions for patient lists
   */
  private async hasAdminPermissions(
    user: User,
    tenant: Tenant,
    type: 'Read' | 'Write'
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
   * Creates a new patient list within a tenant.
   * If the list is private, the creator is automatically added as a member.
   * The operation is performed in a database transaction to ensure data consistency.
   *
   * @param data - The data for creating the patient list
   * @returns The newly created patient list
   */
  public async createPatientList(data: CreatePatientListData): Promise<PatientList> {
    return await db.transaction(async (trx) => {
      const patientList = new PatientList()
      patientList.fill({
        displayName: data.displayName,
        urlSafeName: data.urlSafeName,
        tenantId: data.tenant.id,
        isPublic: data.isPublic,
        createdByUserId: data.creator.id,
      })
      patientList.useTransaction(trx)
      await patientList.save()

      // If the list is private, add the creator as a member
      if (!data.isPublic) {
        await patientList.related('members').attach([data.creator.id], trx)
      }

      return patientList
    })
  }

  /**
   * Retrieves a patient list by its ID, ensuring it belongs to the specified tenant.
   * For private lists, also verifies the user has access.
   *
   * @param id - The ID of the patient list to retrieve
   * @param tenant - The tenant to scope the search to
   * @param user - The user requesting access
   * @returns The patient list if found and accessible, null otherwise
   */
  public async getPatientList(id: number, tenant: Tenant, user: User): Promise<PatientList | null> {
    const query = PatientList.query()
      .where('id', id)
      .where('tenantId', tenant.id)
      .preload('members')

    const list = await query.first()
    if (!list) return null

    // Check if user can access this list
    if (
      list.isPublic ||
      list.createdByUserId === user.id ||
      list.members.some((m) => m.id === user.id) ||
      (await this.hasAdminPermissions(user, tenant, 'Read'))
    ) {
      return list
    }

    return null
  }

  /**
   * Retrieves a patient list by its URL-safe name, ensuring it belongs to the specified tenant.
   * For private lists, also verifies the user has access.
   *
   * @param urlSafeName - The URL-safe name of the patient list to retrieve
   * @param tenant - The tenant to scope the search to
   * @param user - The user requesting access
   * @param options - Optional options for preloading patients
   * @returns The patient list if found and accessible, null otherwise
   */
  public async getPatientListByUrlSafeName(
    urlSafeName: string,
    tenant: Tenant,
    user: User,
    options?: { preloadPatients?: boolean }
  ): Promise<PatientList | null> {
    const query = PatientList.query()
      .where('urlSafeName', urlSafeName)
      .where('tenantId', tenant.id)
      .preload('members')

    if (options?.preloadPatients) {
      query.preload('patients')
    }

    const list = await query.first()
    if (!list) return null

    // Check if user can access this list
    if (
      list.isPublic ||
      list.createdByUserId === user.id ||
      list.members.some((m) => m.id === user.id) ||
      (await this.hasAdminPermissions(user, tenant, 'Read'))
    ) {
      return list
    }

    return null
  }

  /**
   * Retrieves all patient lists within a tenant that the user has access to.
   * This includes:
   * - All public lists in the tenant
   * - Private lists created by the user
   * - Private lists where the user is a member
   * - All lists (public and private) if user has PatientList.Read.All permission
   *
   * @param tenant - The tenant whose lists should be retrieved
   * @param user - The user requesting the lists
   * @param page - The page number for pagination (1-based)
   * @param limit - The maximum number of items per page
   * @returns Object containing the list of accessible patient lists and pagination metadata
   */
  public async getPatientListsInTenant(
    tenant: Tenant,
    user: User,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: PatientList[]; meta: any }> {
    const hasAdminAccess = await this.hasAdminPermissions(user, tenant, 'Read')

    const query = PatientList.query().where('tenantId', tenant.id)

    // If user has admin access, they can see all lists
    if (!hasAdminAccess) {
      query.where((builder) => {
        builder
          .where('isPublic', true)
          .orWhere('createdByUserId', user.id)
          .orWhereHas('members', (membersQuery) => {
            membersQuery.where('users.id', user.id)
          })
      })
    }

    query.orderBy('displayName')

    const paginatedLists = await query.paginate(page, limit)
    return {
      data: paginatedLists.all(),
      meta: paginatedLists.getMeta(),
    }
  }

  /**
   * Adds a user as a member to a private patient list.
   *
   * @param patientList - The patient list to add the member to
   * @param user - The user to add as a member
   * @throws Error if the list is public
   */
  public async addMember(patientList: PatientList, user: User): Promise<void> {
    if (patientList.isPublic) {
      throw new Error('Cannot add members to a public list')
    }

    await patientList.related('members').attach([user.id])
  }

  /**
   * Removes a user's membership from a private patient list.
   * The creator of the list cannot be removed.
   *
   * @param patientList - The patient list to remove the member from
   * @param user - The user to remove
   * @throws Error if the list is public or if attempting to remove the creator
   */
  public async removeMember(patientList: PatientList, user: User): Promise<void> {
    if (patientList.isPublic) {
      throw new Error('Cannot remove members from a public list')
    }

    if (patientList.createdByUserId === user.id) {
      throw new Error('Cannot remove the creator from the list')
    }

    await patientList.related('members').detach([user.id])
  }

  /**
   * Deletes a patient list.
   * Note: The caller should ensure the user has appropriate permissions and the list belongs to the correct tenant.
   *
   * @param patientList - The patient list to delete
   */
  public async deletePatientList(patientList: PatientList): Promise<void> {
    await patientList.delete()
  }
}
