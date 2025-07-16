import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import { TenantService } from '#services/tenant_service'
import { PatientListService } from '#services/patient_list_service'
import User from '#models/user'
import PatientListPolicy from '#policies/patient_list_policy'

@inject()
export default class TransmitAuthService {
  constructor(
    private tenantService: TenantService,
    private patientListService: PatientListService
  ) {}

  async authorizePatientList(ctx: HttpContext, urlSafeName: string): Promise<boolean> {
    const org = ctx.params.org
    if (!org) {
      throw new ResourceNotFoundException('Organization parameter is required')
    }

    const tenant = await this.tenantService.getTenantByUrlSafeName(org)
    if (!tenant) {
      throw new ResourceNotFoundException(`Tenant with url safe name ${org} not found`)
    }

    const patientList = await this.patientListService.getPatientListByUrlSafeName(
      urlSafeName,
      tenant,
      ctx.auth.user as User
    )
    if (!patientList) {
      throw new ResourceNotFoundException('Patient list not found')
    }

    return ctx.bouncer.with(PatientListPolicy).allows('view', patientList)
  }
}
