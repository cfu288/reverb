import { BaseModel, column, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import Permission from './permission.js'
import Tenant from './tenant.js'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare roleKey: string

  @column()
  declare tenantId: number

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @manyToMany(() => User, {
    pivotTable: 'user_roles',
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    pivotTimestamps: true,
  })
  declare permissions: ManyToMany<typeof Permission>
}
