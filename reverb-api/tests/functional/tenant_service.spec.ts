import { test } from '@japa/runner'
import { TenantService } from '#services/tenant_service'
import User from '#models/user'
import Tenant from '#models/tenant'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Tenant service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('createDefaultTenantForUser creates a tenant with the correct display name and urlSafeName', async ({
    assert,
  }) => {
    const tenantService = new TenantService()

    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password_hash: `secret`,
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: `firstName_${Math.random().toString(36).substring(7)}`,
      lastName: `lastName_${Math.random().toString(36).substring(7)}`,
    }

    const user = await User.create(userData)

    const tenant = await tenantService.createDefaultTenantForUser(user)

    assert.instanceOf(tenant, Tenant)
    assert.isNotNull(tenant.displayName)
    assert.isTrue(tenant.displayName.includes(userData.firstName))
    assert.isTrue(tenant.displayName.includes('Default Organization'))
    assert.isNotNull(tenant.urlSafeName)
  })

  test('createDefaultTenantForUser generates default text if tenant already exists and options param is provided', async ({
    assert,
  }) => {
    const tenantService = new TenantService()

    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password_hash: `secret`,
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: `firstName_${Math.random().toString(36).substring(7)}`,
      lastName: `lastName_${Math.random().toString(36).substring(7)}`,
    }

    const user = await User.create(userData)

    // Create a tenant first to simulate existing tenant
    await tenantService.createDefaultTenantForUser(user, { urlSafeName: 'custom-url' })

    // Attempt to create again with options param
    const tenant = await tenantService.createDefaultTenantForUser(user, {
      urlSafeName: 'custom-url',
    })

    // will not throw an error, just generates a new urlSafeName
    assert.instanceOf(tenant, Tenant)
    assert.isNotNull(tenant.displayName)
    assert.isTrue(tenant.displayName.includes(userData.firstName))
    assert.isTrue(tenant.displayName.includes('Default Organization'))
    assert.isNotNull(tenant.urlSafeName)
  })

  test('getTenantsForUser returns empty array when user has no tenants', async ({ assert }) => {
    const tenantService = new TenantService()

    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password_hash: `secret`,
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: `firstName_${Math.random().toString(36).substring(7)}`,
      lastName: `lastName_${Math.random().toString(36).substring(7)}`,
    }

    const user = await User.create(userData)
    const tenants = await tenantService.getTenantsForUser(user)

    assert.isArray(tenants)
    assert.isEmpty(tenants)
  })

  test('getTenantsForUser returns tenants ordered by displayName', async ({ assert }) => {
    const tenantService = new TenantService()

    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password_hash: `secret`,
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: `firstName_${Math.random().toString(36).substring(7)}`,
      lastName: `lastName_${Math.random().toString(36).substring(7)}`,
    }

    const user = await User.create(userData)

    // Create tenants with different display names
    const tenant1 = await Tenant.create({
      displayName: 'Z Tenant',
      urlSafeName: 'z-tenant',
    })
    const tenant2 = await Tenant.create({
      displayName: 'A Tenant',
      urlSafeName: 'a-tenant',
    })
    const tenant3 = await Tenant.create({
      displayName: 'M Tenant',
      urlSafeName: 'm-tenant',
    })

    // Associate tenants with user
    await user.related('tenants').attach([tenant1.id, tenant2.id, tenant3.id])

    const tenants = await tenantService.getTenantsForUser(user)

    assert.isArray(tenants)
    assert.lengthOf(tenants, 3)
    assert.equal(tenants[0].displayName, 'A Tenant')
    assert.equal(tenants[1].displayName, 'M Tenant')
    assert.equal(tenants[2].displayName, 'Z Tenant')
  })
})
