import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PatientService } from '#services/patient_service'
import { PatientListService } from '#services/patient_list_service'
import { TenantService } from '#services/tenant_service'
import PatientPolicy from '#policies/patient_policy'
import {
  createPatientValidator,
  updatePatientValidator,
  patientParamsValidator,
} from '#validators/patient'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import UnauthorizedException from '#exceptions/unauthorized_exception'

@inject()
export default class PatientController {
  constructor(
    protected patientService: PatientService,
    protected patientListService: PatientListService,
    protected tenantService: TenantService
  ) {}

  async create({ auth, bouncer, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(createPatientValidator)

    // Get the tenant and patient list
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)
    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patientList = await this.patientListService.getPatientListByUrlSafeName(
      validatedData.params.list,
      tenant,
      user
    )
    if (!patientList) {
      throw new ResourceNotFoundException('Patient list not found')
    }

    // Check if user can add patients to this list
    if (await bouncer.with(PatientPolicy).denies('create', patientList)) {
      throw new UnauthorizedException('Not authorized to add patients to this list')
    }

    const patient = await this.patientService.createPatient({
      data: validatedData.data,
      patientList,
      tenant,
      creator: user,
    })

    return response.created(patient)
  }

  async update({ auth, bouncer, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(updatePatientValidator)

    // Get the tenant and patient
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)
    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patient = await this.patientService.getPatientById(validatedData.params.id, tenant, user)
    if (!patient) {
      throw new ResourceNotFoundException('Patient not found')
    }

    // Check if user can update this patient
    if (await bouncer.with(PatientPolicy).denies('update', patient)) {
      throw new UnauthorizedException('Not authorized to update this patient')
    }

    const updatedPatient = await this.patientService.updatePatient(patient, {
      data: validatedData.data,
    })

    return response.ok(updatedPatient)
  }

  async view({ auth, bouncer, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(patientParamsValidator)

    // Get the tenant and patient
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)
    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patient = await this.patientService.getPatientById(validatedData.params.id, tenant, user)
    if (!patient) {
      throw new ResourceNotFoundException('Patient not found')
    }

    // Check if user can view this patient
    if (await bouncer.with(PatientPolicy).denies('view', patient)) {
      throw new UnauthorizedException('Not authorized to view this patient')
    }

    return response.ok(patient)
  }

  async delete({ auth, bouncer, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const validatedData = await request.validateUsing(patientParamsValidator)

    // Get the tenant and patient
    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedData.params.org)
    if (!tenant) {
      throw new ResourceNotFoundException(
        `Tenant with url safe name ${validatedData.params.org} not found`
      )
    }

    const patient = await this.patientService.getPatientById(validatedData.params.id, tenant, user)
    if (!patient) {
      throw new ResourceNotFoundException('Patient not found')
    }

    // Check if user can delete this patient
    if (await bouncer.with(PatientPolicy).denies('delete', patient)) {
      throw new UnauthorizedException('Not authorized to delete this patient')
    }

    await this.patientService.deletePatient(patient)
    return response.noContent()
  }
}
