import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import Tenant from './tenant.js'
import Patient from './patient.js'
import User from './user.js'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class PatientList extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare displayName: string

  @column()
  declare urlSafeName: string

  @column()
  declare tenantId: number

  @column()
  declare isPublic: boolean

  @column()
  declare createdByUserId: number

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => User, {
    foreignKey: 'createdByUserId',
  })
  declare creator: BelongsTo<typeof User>

  @manyToMany(() => Patient, {
    pivotTable: 'patient_list_members',
    pivotTimestamps: true,
  })
  declare patients: ManyToMany<typeof Patient>

  @manyToMany(() => User, {
    pivotTable: 'patient_list_user_members',
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
