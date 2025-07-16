import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PatientListService } from '#services/patient_list_service'
import { TenantService } from '#services/tenant_service'
import PatientListPolicy from '#policies/patient_list_policy'
import logger from '@adonisjs/core/services/logger'
import {
  createPatientListValidator,
  patientListParamsValidator,
  tenantParamValidator,
} from '#validators/patient_list'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import UnauthorizedException from '#exceptions/unauthorized_exception'

@inject()
export default class PatientListController {
  constructor(
    protected patientListService: PatientListService,
    protected tenantService: TenantService
  ) {}

  async create({ auth, bouncer, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(createPatientListValidator)
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)

    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    if (await bouncer.with(PatientListPolicy).denies('create', tenant)) {
      throw new UnauthorizedException('Not authorized to create patient lists in this tenant')
    }

    const patientList = await this.patientListService.createPatientList({
      displayName: validatedData.display_name,
      urlSafeName: validatedData.url_safe_name,
      tenant,
      isPublic: validatedData.is_public || false,
      creator: user,
    })

    return response.created(patientList)
  }

  async view({ auth, bouncer, response, request }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(patientListParamsValidator)
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)

    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patientList = await this.patientListService.getPatientListByUrlSafeName(
      validatedData.params.url_safe_name,
      tenant,
      user,
      { preloadPatients: true }
    )

    if (!patientList) {
      throw new ResourceNotFoundException('Patient list not found')
    }

    if (await bouncer.with(PatientListPolicy).denies('view', patientList)) {
      throw new UnauthorizedException('Not authorized to view this patient list')
    }

    return response.ok(patientList)
  }

  async delete({ auth, bouncer, response, request }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(patientListParamsValidator)
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)

    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patientList = await this.patientListService.getPatientListByUrlSafeName(
      validatedData.params.url_safe_name,
      tenant,
      user
    )

    if (!patientList) {
      throw new ResourceNotFoundException('Patient list not found')
    }

    if (await bouncer.with(PatientListPolicy).denies('delete', patientList)) {
      throw new UnauthorizedException('Not authorized to delete this patient list')
    }

    await this.patientListService.deletePatientList(patientList)
    return response.noContent()
  }

  async all({ auth, bouncer, response, request }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(tenantParamValidator)
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)

    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    if (await bouncer.with(PatientListPolicy).denies('all', tenant)) {
      throw new UnauthorizedException('Not authorized to list patient lists in this tenant')
    }

    const patientLists = await this.patientListService.getPatientListsInTenant(tenant, user)
    return response.ok(patientLists)
  }
}
