import Role from '#models/role'
import Permission from '#models/permission'
import type Tenant from '#models/tenant'

export class RoleService {
  /**
   * Initialize default roles for a new tenant
   */
  public static async initializeRolesForTenant(tenant: Tenant) {
    const roles = await Role.updateOrCreateMany(
      ['roleKey', 'tenantId'],
      [
        {
          name: 'admin',
          roleKey: 'default_admin',
          tenantId: tenant.id,
        },
        {
          name: 'clinician',
          roleKey: 'default_clinician',
          tenantId: tenant.id,
        },
        {
          name: 'superuser',
          roleKey: 'default_superuser',
          tenantId: tenant.id,
        },
      ]
    )

    // Get all permissions
    const permissions = await Permission.all()

    // Find the roles we just created
    const adminRole = roles.find((role) => role.roleKey === 'default_admin')
    const clinicianRole = roles.find((role) => role.roleKey === 'default_clinician')
    const superuserRole = roles.find((role) => role.roleKey === 'default_superuser')

    // Assign permissions to admin role
    if (adminRole) {
      const adminPermissions = permissions.filter((permission) =>
        [
          'User.Read.All',
          'User.Write.All',
          'PatientList.Read.All',
          'PatientList.Write.All',
          'PatientList.Delete.All',
          'Role.Read.All',
          'Role.Write.All',
        ].includes(permission.name)
      )
      await adminRole
        .related('permissions')
        .attach(adminPermissions.map((permission) => permission.id))
    }

    // Assign permissions to clinician role
    if (clinicianRole) {
      const clinicianPermissions = permissions.filter((permission) =>
        [
          'User.Read',
          'User.Write',
          'PatientList.Read',
          'PatientList.Write',
          'Patient.Read',
          'Patient.Write',
          'PatientList.Delete',
        ].includes(permission.name)
      )
      await clinicianRole
        .related('permissions')
        .attach(clinicianPermissions.map((permission) => permission.id))
    }

    // Assign all permissions to superuser role
    if (superuserRole) {
      const superuserPermissions = permissions.map((permission) => permission.id)
      await superuserRole.related('permissions').attach(superuserPermissions)
    }

    return roles
  }
}
