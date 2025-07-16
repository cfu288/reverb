import { test } from '@japa/runner'
import { UserService } from '#services/user_service'
import User from '#models/user'
import { TenantService } from '#services/tenant_service'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Role from '#models/role'

test.group('User service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('when no tenant is provided, a user is created with the given params without issue', async ({
    assert,
  }) => {
    const tenantService = new TenantService()
    const userService = new UserService(tenantService)

    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password: `secret`,
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: `firstName_${Math.random().toString(36).substring(7)}`,
      lastName: `lastName_${Math.random().toString(36).substring(7)}`,
    }

    const user = await userService.createUser(userData)

    assert.instanceOf(user, User)
    assert.equal(user.username, userData.username)
    assert.equal(user.email, userData.email)
    assert.equal(user.firstName, userData.firstName)
    assert.equal(user.lastName, userData.lastName)

    // get related tenant
    const tenant = await user.related('tenants').query().first()
    assert.instanceOf(tenant, Tenant)
    assert.isNotNull(tenant?.displayName)
    assert.isTrue(tenant?.displayName.includes(userData.firstName))
    assert.isTrue(tenant?.displayName.includes('Default Organization'))
  })

  test('creates user with custom role in existing tenant and validates permissions', async ({
    assert,
  }) => {
    const tenantService = new TenantService()
    const userService = new UserService(tenantService)

    // First create a tenant
    const tenant = await Tenant.create({
      displayName: 'Test Organization',
      urlSafeName: 'test-org',
    })

    // Create a user with a specific role in the tenant
    const userData = {
      username: `user_${Math.random().toString(36).substring(7)}`,
      password: 'secret',
      email: `user_${Math.random().toString(36).substring(7)}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      tenant: tenant,
      roleKey: 'default_admin', // Explicitly specify role
    }

    const user = await userService.createUser(userData)

    // Verify user was created and associated correctly
    assert.instanceOf(user, User)

    // Verify tenant association
    const associatedTenant = await user.related('tenants').query().first()
    assert.equal(associatedTenant?.id, tenant.id)

    // Verify role assignment
    const userRole = await user.related('roles').query().first()
    assert.equal(userRole?.roleKey, 'default_admin')
    assert.equal(userRole?.tenantId, tenant.id)
  })

  test('getUserByUsernameAndTenant returns correct user with preloaded relations', async ({
    assert,
  }) => {
    const tenantService = new TenantService()
    const userService = new UserService(tenantService)

    // Create test data
    const tenant = await Tenant.create({
      displayName: 'Test Org',
      urlSafeName: 'test-org-preload',
    })

    const userData = {
      username: 'test_user_preload',
      password: 'secret',
      email: 'test_preload@example.com',
      firstName: 'Test',
      lastName: 'User',
      tenant: tenant,
    }

    await userService.createUser(userData)

    // Test preloading both tenants and roles
    const user = await userService.getUserByUsernameAndTenant('test_user_preload', tenant, {
      preloadTenants: true,
      preloadRoles: true,
    })

    assert.instanceOf(user, User)
    assert.isTrue('tenants' in user!.$preloaded)
    assert.isTrue('roles' in user!.$preloaded)
    assert.isArray(user!.$preloaded.tenants)
    assert.isArray(user!.$preloaded.roles)
    assert.equal((user!.$preloaded.tenants as any[]).length, 1)
    assert.equal((user!.$preloaded.roles as any[]).length, 1)
  })

  test('getUsersInTenant correctly paginates and orders results', async ({ assert }) => {
    const tenantService = new TenantService()
    const userService = new UserService(tenantService)

    // Create a tenant
    const tenant = await Tenant.create({
      displayName: 'Pagination Test Org',
      urlSafeName: 'pagination-test-org',
    })

    // Create multiple users in the tenant
    const userPromises = Array.from({ length: 15 }, (_, i) =>
      userService.createUser({
        username: `paginated_user_${i}`,
        password: 'secret',
        email: `paginated_${i}@example.com`,
        firstName: `User`,
        lastName: `${i}`,
        tenant: tenant,
      })
    )
    await Promise.all(userPromises)

    // Test first page
    const firstPage = await userService.getUsersInTenant(tenant, 1, 5)
    assert.lengthOf(firstPage.data, 5)
    assert.equal(firstPage.meta.total, 15)
    assert.equal(firstPage.meta.lastPage, 3) // 15 items with 5 per page = 3 pages
    assert.equal(firstPage.meta.currentPage, 1)

    // Test second page
    const secondPage = await userService.getUsersInTenant(tenant, 2, 5)
    assert.lengthOf(secondPage.data, 5)
    assert.notEqual(firstPage.data[0].id, secondPage.data[0].id)

    // Test last page
    const lastPage = await userService.getUsersInTenant(tenant, 3, 5)
    assert.lengthOf(lastPage.data, 5)
    assert.equal(lastPage.meta.currentPage, 3)
  })

  test('handles duplicate username in same tenant gracefully', async ({ assert }) => {
    const tenantService = new TenantService()
    const userService = new UserService(tenantService)

    const tenant = await Tenant.create({
      displayName: 'Duplicate Test Org',
      urlSafeName: 'duplicate-test-org',
    })

    const userData = {
      username: 'duplicate_user',
      password: 'secret',
      email: 'duplicate@example.com',
      firstName: 'Duplicate',
      lastName: 'User',
      tenant: tenant,
    }

    await userService.createUser(userData)

    // Attempt to create another user with the same username in the same tenant
    try {
      await userService.createUser({
        ...userData,
        email: 'different@example.com', // Different email but same username
      })
      assert.fail('Should have thrown an error for duplicate username')
    } catch (error) {
      assert.exists(error)
    }
  })
})
