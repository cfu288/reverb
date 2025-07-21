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
    console.log(`[Transmit Auth] Starting authorization for channel: org/${org}/patient-lists/${url_safe_name}`)
    const startTime = Date.now()
    
    const transmitAuthService = await app.container.make(TransmitAuthService)

    // Verify authentication
    console.log('[Transmit Auth] Authenticating user...')
    await ctx.auth.authenticate()
    const user = ctx.auth.user
    if (!user) {
      console.log('[Transmit Auth] No authenticated user found')
      return false
    }
    console.log(`[Transmit Auth] User authenticated: ${user.email}`)

    try {
      // Get tenant
      console.log(`[Transmit Auth] Getting tenant by URL safe name: ${org}`)
      const tenantService = await app.container.make(TenantService)
      const tenant = await tenantService.getTenantByUrlSafeName(org)
      if (!tenant) {
        console.log(`[Transmit Auth] Tenant not found: ${org}`)
        return false
      }
      console.log(`[Transmit Auth] Tenant found: ${tenant.name}`)

      // Verify user belongs to tenant
      console.log('[Transmit Auth] Verifying user belongs to tenant...')
      const userBelongsToTenant = await user
        .related('tenants')
        .query()
        .where('tenants.id', tenant.id)
        .first()

      if (!userBelongsToTenant) {
        console.log('[Transmit Auth] User does not belong to tenant')
        return false
      }
      console.log('[Transmit Auth] User belongs to tenant')

      // Get patient list
      console.log(`[Transmit Auth] Getting patient list: ${url_safe_name}`)
      const patientListService = await app.container.make(PatientListService)
      const patientList = await patientListService.getPatientListByUrlSafeName(
        url_safe_name,
        tenant,
        user
      )

      if (!patientList) {
        console.log(`[Transmit Auth] Patient list not found: ${url_safe_name}`)
        return false
      }
      console.log(`[Transmit Auth] Patient list found: ${patientList.name}`)

      // Check authorization using policy
      console.log('[Transmit Auth] Checking authorization policy...')
      const allowed = await ctx.bouncer.with('PatientListPolicy').allows('view', patientList)
      
      const elapsed = Date.now() - startTime
      console.log(`[Transmit Auth] Authorization completed in ${elapsed}ms. Result: ${allowed}`)
      
      return allowed
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[Transmit Auth] Channel authorization error after ${elapsed}ms:`, error)
      return false
    }
  }
)
