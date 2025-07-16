import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { TenantService } from '#services/tenant_service'
import TenantPolicy from '#policies/tenant_policy'
import logger from '@adonisjs/core/services/logger'
import { tenantParamValidator } from '#validators/tenant'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import UnauthorizedException from '#exceptions/unauthorized_exception'

@inject()
export default class TenantController {
  constructor(protected tenantService: TenantService) {}

  async view({ response, currentTenantPathParam, bouncer, auth }: HttpContext) {
    const user = await auth.authenticate()

    // Validate the tenant parameter
    const validatedParams = await tenantParamValidator.validate({
      params: { org: currentTenantPathParam },
    })

    const tenant = await this.tenantService.getTenantByUrlSafeName(validatedParams.params.org)
    if (!tenant) {
      logger.info(`Tenant not found: ${validatedParams.params.org}`)
      throw new ResourceNotFoundException('Resource not found')
    }

    if (await bouncer.with(TenantPolicy).denies('view', tenant)) {
      logger.info(`Unauthorized tenant view attempt: ${tenant.id}`, { userId: user.id })
      throw new UnauthorizedException('Not authorized to perform this action')
    }

    return response.ok(tenant)
  }

  /**
   * List all tenants available for the logged in user
   */
  async all({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    const tenants = await this.tenantService.getTenantsForUser(user)
    return response.ok(tenants)
  }
}
