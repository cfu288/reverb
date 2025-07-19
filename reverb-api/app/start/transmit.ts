import transmit from '@adonisjs/transmit/services/main'
// import Chat from '#models/chat'
import PatientList from '#models/patient_list'
import type { HttpContext } from '@adonisjs/core/http'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import { inject } from '@adonisjs/core'
import { TenantService } from '#services/tenant_service'
import { PatientListService } from '#services/patient_list_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import TransmitAuthService from '#services/transmit_auth_service'

// Authorize health check channel - allow authenticated users only
transmit.authorize('__health__', async (ctx: HttpContext) => {
  try {
    await ctx.auth.authenticate()
    return ctx.auth.isAuthenticated
  } catch {
    return false
  }
})

// Authorize tenant-scoped patient list channels
transmit.authorize<{ org: string; url_safe_name: string }>(
  'org/:org/patient-lists/:url_safe_name',
  async (ctx: HttpContext, { org, url_safe_name }) => {
    const transmitAuthService = await app.container.make(TransmitAuthService)

    // Verify authentication
    await ctx.auth.authenticate()
    const user = ctx.auth.user
    if (!user) {
      return false
    }

    try {
      // Get tenant
      const tenantService = await app.container.make(TenantService)
      const tenant = await tenantService.getTenantByUrlSafeName(org)
      if (!tenant) {
        return false
      }

      // Verify user belongs to tenant
      const userBelongsToTenant = await user
        .related('tenants')
        .query()
        .where('tenants.id', tenant.id)
        .first()

      if (!userBelongsToTenant) {
        return false
      }

      // Get patient list
      const patientListService = await app.container.make(PatientListService)
      const patientList = await patientListService.getPatientListByUrlSafeName(
        url_safe_name,
        tenant,
        user
      )

      if (!patientList) {
        return false
      }

      // Check authorization using policy
      return ctx.bouncer.with('PatientListPolicy').allows('view', patientList)
    } catch (error) {
      console.error('Channel authorization error:', error)
      return false
    }
  }
)
