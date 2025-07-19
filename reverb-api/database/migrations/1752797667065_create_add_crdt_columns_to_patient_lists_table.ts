import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'patient_lists'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add CRDT document column - stores binary CRDT data
      table.binary('crdt_document').nullable()

      // Add CRDT version column - tracks document version for conflict detection
      table.integer('crdt_version').defaultTo(0).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('crdt_document')
      table.dropColumn('crdt_version')
    })
  }
}
