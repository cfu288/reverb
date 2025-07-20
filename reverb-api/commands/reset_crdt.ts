import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import PatientList from '#models/patient_list'
import { Model } from 'json-joy/lib/json-crdt/model/Model.js'
import { patientListSchema } from '#schemas/patient_list_crdt'

export default class ResetCrdt extends BaseCommand {
  static commandName = 'patient-list:reset-crdt'
  static description = 'Reset CRDT document for a patient list'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const urlSafeName = await this.prompt.ask('Enter the patient list URL safe name', {
      default: 'default',
    })

    const patientList = await PatientList.query().where('urlSafeName', urlSafeName).first()

    if (!patientList) {
      this.logger.error(`Patient list "${urlSafeName}" not found`)
      return
    }

    const confirm = await this.prompt.confirm(
      `Are you sure you want to reset the CRDT for "${patientList.displayName}"? This will clear all patient data.`
    )

    if (!confirm) {
      this.logger.info('Operation cancelled')
      return
    }

    // Create a fresh CRDT
    const model = Model.create()
    model.api.root(patientListSchema)

    // Save it
    const crdtBinary = model.toBinary()
    patientList.crdtDocument = Buffer.from(crdtBinary)
    patientList.crdtVersion = 0
    await patientList.save()

    this.logger.success(`CRDT reset successfully for patient list "${patientList.displayName}"`)
  }
}
