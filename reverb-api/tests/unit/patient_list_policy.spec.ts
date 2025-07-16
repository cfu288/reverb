import PatientList from '#models/patient_list'
import Role from '#models/role'
import Tenant from '#models/tenant'
import User from '#models/user'
import PatientListPolicy from '#policies/patient_list_policy'

import { test } from '@japa/runner'

test.group('Patient List Policy', (group) => {
  let defaultTenant: Tenant
  group.setup(async () => {
    // Create a default tenant for tests that don't need specific tenant setups
    defaultTenant = await Tenant.create({
      displayName: `Default Test Tenant ${Math.floor(Math.random() * 1000000)}`,
      urlSafeName: `default-test-tenant-${Math.floor(Math.random() * 1000000)}`,
    })
  })

  group.teardown(async () => {
    // Delete the default tenant after tests run
    await defaultTenant.delete()
  })

  async function createUser(tenant: Tenant, roleKey: string) {
    const user = await User.create({
      email: `test-${Math.floor(Math.random() * 1000000)}@example.com`,
      password_hash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: `testuser-${Math.floor(Math.random() * 1000000)}`,
    })

    // Get the standard role for this tenant
    const role = await Role.query()
      .where('tenantId', tenant.id)
      .where('roleKey', roleKey)
      .firstOrFail()

    // Attach role to user
    await user.related('roles').save(role)

    // Associate user with tenant
    await user.related('tenants').save(tenant)

    return user
  }

  async function createTenant() {
    const tenant = await Tenant.create({
      displayName: `Test Tenant ${Math.floor(Math.random() * 1000000)}`,
      urlSafeName: `test-tenant-${Math.floor(Math.random() * 1000000)}`,
    })

    return tenant
  }

  async function createPatientList(tenant: Tenant, creator: User, isPublic: boolean) {
    const random = Math.floor(Math.random() * 1000000)
    return await PatientList.create({
      displayName: `Test List ${random}`,
      urlSafeName: `test-list-${random}`,
      isPublic,
      tenantId: tenant.id,
      createdByUserId: creator.id,
    })
  }

  test('regular user can create both private and public lists', async ({ assert }) => {
    const regularUser = await createUser(defaultTenant, 'default_clinician')
    const policy = new PatientListPolicy()
    const canCreate = await policy.create(regularUser, defaultTenant)
    assert.isTrue(canCreate)
  })

  test('super user can create both private and public lists', async ({ assert }) => {
    const superUser = await createUser(defaultTenant, 'default_superuser')
    const policy = new PatientListPolicy()
    const canCreate = await policy.create(superUser, defaultTenant)
    assert.isTrue(canCreate)
  })

  test('regular user cannot modify private list they did not create', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const otherUser = await createUser(defaultTenant, 'default_clinician')
    const list = await createPatientList(defaultTenant, creator, false)

    const policy = new PatientListPolicy()
    const canManagePatients = await policy.managePatients(otherUser, list)
    assert.isFalse(canManagePatients)
  })

  test('regular user can modify any public list in their tenant', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const otherUser = await createUser(defaultTenant, 'default_clinician')
    const list = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    const canManagePatients = await policy.managePatients(otherUser, list)
    assert.isTrue(canManagePatients, 'Regular users should be able to modify public lists')
  })

  test('regular user can modify list they created regardless of privacy', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const privateList = await createPatientList(defaultTenant, creator, false)
    const publicList = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    assert.isTrue(
      await policy.managePatients(creator, privateList),
      'Creator should be able to modify their private list'
    )
    assert.isTrue(
      await policy.managePatients(creator, publicList),
      'Creator should be able to modify their public list'
    )
  })

  test('super user can modify any list in their tenant', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const superUser = await createUser(defaultTenant, 'default_superuser')
    const list = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    const canManagePatients = await policy.managePatients(superUser, list)
    assert.isTrue(canManagePatients)
  })

  test('no user can modify list from another tenant', async ({ assert }) => {
    // For cross-tenant tests, we need separate tenants
    const tenant1 = await createTenant()
    const tenant2 = await createTenant()

    const superUser = await createUser(tenant2, 'default_superuser')
    const creator = await createUser(tenant1, 'default_clinician')
    const list = await createPatientList(tenant1, creator, true)

    const policy = new PatientListPolicy()
    const canManagePatients = await policy.managePatients(superUser, list)
    assert.isFalse(canManagePatients)
  })

  test('regular user can delete list they created', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const list = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    const canDelete = await policy.delete(creator, list)
    assert.isTrue(canDelete)
  })

  test('regular user cannot delete list they did not create', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const otherUser = await createUser(defaultTenant, 'default_clinician')
    const list = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    const canDelete = await policy.delete(otherUser, list)
    assert.isFalse(canDelete)
  })

  test('super user can delete any list in their tenant', async ({ assert }) => {
    const creator = await createUser(defaultTenant, 'default_clinician')
    const superUser = await createUser(defaultTenant, 'default_superuser')
    const list = await createPatientList(defaultTenant, creator, true)

    const policy = new PatientListPolicy()
    const canDelete = await policy.delete(superUser, list)
    assert.isTrue(canDelete)
  })

  test('no user can create lists on other tenants', async ({ assert }) => {
    // For cross-tenant tests, we need separate tenants
    const tenant1 = await createTenant()
    const tenant2 = await createTenant()

    const superUser = await createUser(tenant1, 'default_superuser')
    const policy = new PatientListPolicy()

    const canCreate = await policy.create(superUser, tenant2)
    assert.isFalse(canCreate, 'Super user should not be able to create lists in other tenants')

    const regularUser = await createUser(tenant1, 'default_clinician')
    const canCreateRegular = await policy.create(regularUser, tenant2)
    assert.isFalse(
      canCreateRegular,
      'Regular user should not be able to create lists in other tenants'
    )
  })
})
