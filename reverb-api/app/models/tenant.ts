import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  manyToMany,
  hasMany,
  beforeCreate,
  afterCreate,
} from '@adonisjs/lucid/orm'
import User from './user.js'
import Role from './role.js'
import PatientList from './patient_list.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { RoleService } from '#services/role_service'

export default class Tenant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare displayName: string

  @column()
  declare urlSafeName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'user_tenants',
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Role, {
    pivotTable: 'tenant_roles',
    pivotTimestamps: true,
  })
  declare roles: ManyToMany<typeof Role>

  @hasMany(() => PatientList)
  declare patientLists: HasMany<typeof PatientList>

  @afterCreate()
  public static async createDefaultRoles(tenant: Tenant) {
    await RoleService.initializeRolesForTenant(tenant)
  }
}
