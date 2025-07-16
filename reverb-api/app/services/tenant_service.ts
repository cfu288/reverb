import Tenant from '#models/tenant'
import User from '#models/user'

export class TenantService {
  public async createDefaultTenantForUser(
    { firstName }: User,
    options?: { urlSafeName?: string }
  ): Promise<Tenant> {
    const maxAttempts = 5
    let attemptCount = 0
    let newTenant: Tenant | null = null

    while (attemptCount < maxAttempts) {
      // Generate a unique urlSafeName for the tenant
      const generatedUrlSafeName =
        options?.urlSafeName && attemptCount < 2
          ? options.urlSafeName
          : `${firstName.toLowerCase()}-default-org-${Math.random().toString(36).substring(2, 15)}`

      // Check if a tenant with the same urlSafeName already exists
      const existingTenant = await Tenant.findBy('urlSafeName', generatedUrlSafeName)
      if (!existingTenant) {
        // Create a new tenant if no existing tenant is found
        newTenant = await Tenant.create({
          displayName: `${firstName} Default Organization`,
          urlSafeName: generatedUrlSafeName,
        })
        break
      }

      attemptCount++
    }

    // Throw an error if unable to create a unique tenant after max attempts
    if (!newTenant) {
      throw new Error('Unable to create a unique tenant after 5 attempts')
    }

    return newTenant
  }

  public async createTenant({
    displayName,
    urlSafeName,
  }: {
    displayName: string
    urlSafeName: string
  }): Promise<Tenant> {
    return Tenant.create({
      displayName,
      urlSafeName,
    })
  }

  public async getTenant(id: number): Promise<Tenant | null> {
    return Tenant.find(id)
  }

  public async getTenantByUrlSafeName(urlSafeName: string): Promise<Tenant | null> {
    return Tenant.findBy('urlSafeName', urlSafeName)
  }

  public async getTenantsForUser(user: User): Promise<Tenant[]> {
    return user.related('tenants').query().orderBy('displayName')
  }
}
