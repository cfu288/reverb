import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import PatientList from './patient_list.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Patient extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare data: any

  @manyToMany(() => PatientList, {
    pivotTable: 'patient_list_members',
    pivotTimestamps: true,
  })
  declare patientLists: ManyToMany<typeof PatientList>

  @column.dateTime()
  declare createdAt: DateTime

  @column.dateTime()
  declare updatedAt: DateTime
}
