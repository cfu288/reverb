import { inject } from '@adonisjs/core'
import type User from '#models/user'
import type Tenant from '#models/tenant'
import Patient from '#models/patient'
import PatientList from '#models/patient_list'

interface CreatePatientData {
  data: any
  patientList: PatientList
  tenant: Tenant
  creator: User
}

interface UpdatePatientData {
  data: any
}

@inject()
export class PatientService {
  /**
   * Creates a new patient in the specified patient list and tenant.
   */
  async createPatient(data: CreatePatientData): Promise<Patient> {
    const patient = await Patient.create({
      data: {
        ...data.data,
        tenantId: data.tenant.id,
        createdByUserId: data.creator.id,
      },
    })

    // Create the relationship in the pivot table
    await patient.related('patientLists').attach([data.patientList.id])

    return patient
  }

  /**
   * Updates an existing patient with new data.
   */
  async updatePatient(patient: Patient, data: UpdatePatientData): Promise<Patient> {
    patient.data = {
      ...patient.data,
      ...data.data,
    }

    await patient.save()
    return patient
  }

  /**
   * Retrieves a patient by ID, ensuring tenant access.
   */
  async getPatientById(id: string, tenant: Tenant, user: User): Promise<Patient | null> {
    const patient = await Patient.query().where('id', id).where('data->tenantId', tenant.id).first()

    if (!patient) {
      return null
    }

    // For private lists, verify membership
    const patientList = await PatientList.findOrFail(patient.data.patientListId)
    const members = await patientList.related('members').query().where('id', user.id)

    if (!patientList.isPublic) {
      const isMember = patientList.createdByUserId === user.id || members.length > 0

      if (!isMember) {
        return null
      }
    }

    return patient
  }

  /**
   * Deletes a patient.
   */
  async deletePatient(patient: Patient): Promise<void> {
    await patient.delete()
  }
}
