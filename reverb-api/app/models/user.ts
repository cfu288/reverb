import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Role from './role.js'
import Tenant from './tenant.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('argon'), {
  uids: ['username', 'email'],
  passwordColumnName: 'password_hash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true, serializeAs: 'id' })
  declare id: number

  @column({ serializeAs: 'username' })
  declare username: string

  @column({ serializeAs: 'email' })
  declare email: string

  @column({ serializeAs: 'first_name' })
  declare firstName: string

  @column({ serializeAs: 'last_name' })
  declare lastName: string

  @column({ serializeAs: null })
  declare password_hash: string

  @column.dateTime({ autoCreate: true, serializeAs: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: 'updated_at' })
  declare updatedAt: DateTime

  @manyToMany(() => Role, {
    pivotTable: 'user_roles',
    pivotTimestamps: true,
    serializeAs: 'roles',
  })
  declare roles: ManyToMany<typeof Role>

  @manyToMany(() => Tenant, {
    pivotTable: 'user_tenants',
    pivotTimestamps: true,
    serializeAs: 'tenants',
  })
  declare tenants: ManyToMany<typeof Tenant>
}
