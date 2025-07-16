import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'patient_lists'

  async up() {
    this.schema.createTable('patient_list_user_members', (table) => {
      table.increments('id')
      table
        .integer('patient_list_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('patient_lists')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Ensure a user can only be added once to a list
      table.unique(['patient_list_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable('patient_list_user_members')
  }
}
