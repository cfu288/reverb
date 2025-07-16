import { test } from '@japa/runner'
import User from '#models/user'
import Role from '#models/role'
import Tenant from '#models/tenant'
import UserPolicy from '#policies/user_policy'
import type { CreateUserData } from '#services/user_service'

test.group('User Policy', (group) => {
  let defaultTenant: Tenant

  group.setup(async () => {
    defaultTenant = await Tenant.create({
      displayName: `Default Test Tenant ${Math.floor(Math.random() * 1000000)}`,
      urlSafeName: `default-test-tenant-${Math.floor(Math.random() * 1000000)}`,
    })
  })

  async function createUser(tenant: Tenant, roleKey: string) {
    const user = await User.create({
      email: `test-${Math.floor(Math.random() * 1000000)}@example.com`,
      password_hash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: `testuser-${Math.floor(Math.random() * 1000000)}`,
    })

    const role = await Role.query()
      .where('tenantId', tenant.id)
      .where('roleKey', roleKey)
      .preload('permissions')
      .firstOrFail()

    await user.related('roles').save(role)
    await user.related('tenants').save(tenant)

    return user
  }

  async function createTenant() {
    return await Tenant.create({
      displayName: `Test Tenant ${Math.floor(Math.random() * 1000000)}`,
      urlSafeName: `test-tenant-${Math.floor(Math.random() * 1000000)}`,
    })
  }

  test('unauthorized user can create themselves without a role', async ({ assert }) => {
    const policy = new UserPolicy()

    // Test self-registration (no tenant specified)
    const selfRegisterData: Partial<CreateUserData> = {
      email: 'newuser@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
    }
    const canSelfRegister = await policy.create(null as any, selfRegisterData, null as any)
    assert.isTrue(canSelfRegister, 'Unauthorized users should be able to self-register')

    // Test trying to create in existing tenant (even without role)
    const tenantRegisterData: Partial<CreateUserData> = {
      email: 'newuser@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
    }
    const canRegisterInTenant = await policy.create(null as any, tenantRegisterData, defaultTenant)
    assert.isFalse(
      canRegisterInTenant,
      'Unauthorized users should not be able to create users in existing tenants, even without role'
    )

    // Also verify with role specified
    const tenantRegisterWithRoleData: Partial<CreateUserData> = {
      ...tenantRegisterData,
      roleKey: 'default_clinician',
    }
    const canRegisterInTenantWithRole = await policy.create(
      null as any,
      tenantRegisterWithRoleData,
      defaultTenant
    )
    assert.isFalse(
      canRegisterInTenantWithRole,
      'Unauthorized users should not be able to create users in existing tenants with roles'
    )
  })

  test('clinician cannot create any users', async ({ assert }) => {
    const clinician = await createUser(defaultTenant, 'default_clinician')
    const policy = new UserPolicy()

    // Test creating another clinician
    const clinicianData: Partial<CreateUserData> = {
      email: 'newclinician@example.com',
      username: 'newclinician',
      firstName: 'New',
      lastName: 'Clinician',
      password: 'password123',
      roleKey: 'default_clinician',
    }
    const canCreateClinician = await policy.create(clinician, clinicianData, defaultTenant)
    assert.isFalse(canCreateClinician, 'Clinician should not be able to create other clinicians')

    // Test creating an admin
    const adminData: Partial<CreateUserData> = {
      email: 'newadmin@example.com',
      username: 'newadmin',
      firstName: 'New',
      lastName: 'Admin',
      password: 'password123',
      roleKey: 'default_admin',
    }
    const canCreateAdmin = await policy.create(clinician, adminData, defaultTenant)
    assert.isFalse(canCreateAdmin, 'Clinician should not be able to create admin users')
  })

  test('admin can create users with any role in their tenant', async ({ assert }) => {
    const admin = await createUser(defaultTenant, 'default_admin')
    const policy = new UserPolicy()

    // Test creating a clinician
    const clinicianData: Partial<CreateUserData> = {
      email: 'newclinician@example.com',
      username: 'newclinician',
      firstName: 'New',
      lastName: 'Clinician',
      password: 'password123',
      roleKey: 'default_clinician',
    }
    const canCreateClinician = await policy.create(admin, clinicianData, defaultTenant)
    assert.isTrue(canCreateClinician, 'Admin should be able to create clinician users')

    // Test creating another admin
    const adminData: Partial<CreateUserData> = {
      email: 'newadmin@example.com',
      username: 'newadmin',
      firstName: 'New',
      lastName: 'Admin',
      password: 'password123',
      roleKey: 'default_admin',
    }
    const canCreateAdmin = await policy.create(admin, adminData, defaultTenant)
    assert.isTrue(canCreateAdmin, 'Admin should be able to create admin users')
  })

  test('superuser can create users with any role in their tenant', async ({ assert }) => {
    const superuser = await createUser(defaultTenant, 'default_superuser')
    const policy = new UserPolicy()

    // Test creating a clinician
    const clinicianData: Partial<CreateUserData> = {
      email: 'newclinician@example.com',
      username: 'newclinician',
      firstName: 'New',
      lastName: 'Clinician',
      password: 'password123',
      roleKey: 'default_clinician',
    }
    const canCreateClinician = await policy.create(superuser, clinicianData, defaultTenant)
    assert.isTrue(canCreateClinician, 'Superuser should be able to create clinician users')

    // Test creating an admin
    const adminData: Partial<CreateUserData> = {
      email: 'newadmin@example.com',
      username: 'newadmin',
      firstName: 'New',
      lastName: 'Admin',
      password: 'password123',
      roleKey: 'default_admin',
    }
    const canCreateAdmin = await policy.create(superuser, adminData, defaultTenant)
    assert.isTrue(canCreateAdmin, 'Superuser should be able to create admin users')
  })

  test('no user can create users in another tenant', async ({ assert }) => {
    const tenant1 = await createTenant()
    const tenant2 = await createTenant()

    const admin = await createUser(tenant1, 'default_admin')
    const policy = new UserPolicy()

    const userData: Partial<CreateUserData> = {
      email: 'newuser@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
      roleKey: 'default_clinician',
    }

    const canCreate = await policy.create(admin, userData, tenant2)
    assert.isFalse(canCreate, 'Admin should not be able to create users in another tenant')

    // Test with superuser as well
    const superuser = await createUser(tenant1, 'default_superuser')
    const canCreateAsSuperuser = await policy.create(superuser, userData, tenant2)
    assert.isFalse(
      canCreateAsSuperuser,
      'Superuser should not be able to create users in another tenant'
    )
  })

  test('user can always view their own profile regardless of permissions', async ({ assert }) => {
    const user = await createUser(defaultTenant, 'default_clinician')
    const policy = new UserPolicy()

    const canViewSelf = await policy.view(user, user.username, defaultTenant)
    assert.isTrue(canViewSelf, 'User should be able to view their own profile')
  })

  test('user cannot view other profiles without User.Read.All permission', async ({ assert }) => {
    const user = await createUser(defaultTenant, 'default_clinician')
    const otherUser = await createUser(defaultTenant, 'default_clinician')
    const policy = new UserPolicy()

    const canViewOther = await policy.view(user, otherUser.username, defaultTenant)
    assert.isFalse(
      canViewOther,
      'User without User.Read.All permission should not be able to view other profiles'
    )
  })

  test('admin can view other profiles with User.Read.All permission', async ({ assert }) => {
    const admin = await createUser(defaultTenant, 'default_admin')
    const otherUser = await createUser(defaultTenant, 'default_clinician')
    const policy = new UserPolicy()

    const canViewOther = await policy.view(admin, otherUser.username, defaultTenant)
    assert.isTrue(
      canViewOther,
      'Admin with User.Read.All permission should be able to view other profiles'
    )
  })

  test('user cannot view profiles from another tenant', async ({ assert }) => {
    const tenant1 = await createTenant()
    const tenant2 = await createTenant()

    const admin = await createUser(tenant1, 'default_admin')
    const otherUser = await createUser(tenant2, 'default_clinician')
    const policy = new UserPolicy()

    const canViewOther = await policy.view(admin, otherUser.username, tenant2)
    assert.isFalse(canViewOther, 'User should not be able to view profiles from another tenant')
  })
})
