import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // user_roles junction table
    this.schema.createTable('user_roles', (table) => {
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')
        .index()
      table.timestamps(true, true)
      table.primary(['user_id', 'role_id'])
    })

    // role_permissions junction table
    this.schema.createTable('role_permissions', (table) => {
      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')
        .index()
      table
        .integer('permission_id')
        .unsigned()
        .references('id')
        .inTable('permissions')
        .onDelete('CASCADE')
        .index()
      table.timestamps(true, true)
      table.primary(['role_id', 'permission_id'])
    })

    // tenant_roles junction table
    this.schema.createTable('tenant_roles', (table) => {
      table
        .integer('tenant_id')
        .unsigned()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
        .index()
      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')
        .index()
      table.timestamps(true, true)
      table.primary(['tenant_id', 'role_id'])
    })

    // patient_list_members junction table
    this.schema.createTable('patient_list_members', (table) => {
      table
        .integer('patient_list_id')
        .unsigned()
        .references('id')
        .inTable('patient_lists')
        .onDelete('CASCADE')
        .index()
      table
        .integer('patient_id')
        .unsigned()
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE')
        .index()
      table.timestamps(true, true)
      table.primary(['patient_list_id', 'patient_id'])
    })

    // user_tenants junction table
    this.schema.createTable('user_tenants', (table) => {
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table
        .integer('tenant_id')
        .unsigned()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
        .index()
      table.timestamps(true, true)
      table.primary(['user_id', 'tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable('user_roles')
    this.schema.dropTable('role_permissions')
    this.schema.dropTable('tenant_roles')
    this.schema.dropTable('patient_list_members')
    this.schema.dropTable('user_tenants')
  }
}
