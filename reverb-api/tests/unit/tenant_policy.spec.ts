import { test } from '@japa/runner'
import User from '#models/user'
import Tenant from '#models/tenant'
import TenantPolicy from '#policies/tenant_policy'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Tenant Policy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createUniqueTenant() {
    return await Tenant.create({
      displayName: `Test Tenant ${Math.floor(Math.random() * 1000000)}`,
      urlSafeName: `test-tenant-${Math.floor(Math.random() * 1000000)}`,
    })
  }

  test('tenant user can view their tenant', async ({ assert }) => {
    // Arrange
    const user = await User.create({
      email: `test-${Math.floor(Math.random() * 1000000)}@example.com`,
      password_hash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: `testuser-${Math.floor(Math.random() * 1000000)}`,
    })

    const tenant = await createUniqueTenant()
    await tenant.related('users').attach([user.id])
    const policy = new TenantPolicy()

    // Act
    const canView = await policy.view(user, tenant)

    // Assert
    assert.isTrue(canView)
  })

  test('non-tenant user cannot view other tenant', async ({ assert }) => {
    // Arrange
    const user = await User.create({
      email: `test-${Math.floor(Math.random() * 1000000)}@example.com`,
      password_hash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: `testuser-${Math.floor(Math.random() * 1000000)}`,
    })

    const tenant = await createUniqueTenant()
    // Not attaching user to tenant

    const policy = new TenantPolicy()

    // Act
    const canView = await policy.view(user, tenant)

    // Assert
    assert.isFalse(canView)
  })
})
