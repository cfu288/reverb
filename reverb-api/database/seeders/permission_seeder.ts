import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Permission from '#models/permission'
export default class extends BaseSeeder {
  async run() {
    await Permission.updateOrCreateMany('name', [
      {
        name: 'User.Read',
        description: 'Read own user data',
      },
      {
        name: 'User.Write',
        description: 'Create own user data',
      },
      {
        name: 'User.Read.All',
        description: 'Read all user data',
      },
      {
        name: 'User.Write.All',
        description: 'Create all user data',
      },
      {
        name: 'PatientList.Read',
        description: 'Read patient list data that user has access to',
      },
      {
        name: 'PatientList.Write',
        description: 'Create patient list data that user has access to',
      },
      {
        name: 'PatientList.Read.All',
        description: 'Read any patient list data',
      },
      {
        name: 'PatientList.Write.All',
        description: 'Create all patient list data',
      },
      {
        name: 'PatientList.Delete',
        description: 'Delete patient list data that user has access to',
      },
      {
        name: 'PatientList.Delete.All',
        description: 'Delete any patient list data',
      },
      {
        name: 'Patient.Read',
        description: 'Read patient data',
      },
      {
        name: 'Patient.Write',
        description: 'Create patient data',
      },
      {
        name: 'Patient.Read.All',
        description: 'Read all patient data',
      },
      {
        name: 'Patient.Write.All',
        description: 'Create all patient data',
      },
      {
        name: 'Patient.Delete',
        description: 'Delete patient data',
      },
      {
        name: 'Patient.Delete.All',
        description: 'Delete all patient data',
      },
      {
        name: 'Role.Read.All',
        description: 'Read all role data',
      },
      {
        name: 'Role.Write.All',
        description: 'Create all role data',
      },
    ])
    // Write your database queries inside the run method
  }
}
