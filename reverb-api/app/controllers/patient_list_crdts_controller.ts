import type { HttpContext } from '@adonisjs/core/http'
import PatientList from '#models/patient_list'
import { Model } from 'json-joy/lib/json-crdt/model/Model.js'
import { Patch } from 'json-joy/lib/json-crdt-patch/index.js'
import {
  encode as encodeVerbose,
  decode as decodeVerbose,
} from 'json-joy/lib/json-crdt-patch/codec/verbose/index.js'
import transmit from '@adonisjs/transmit/services/main'
import { patientListSchema, createEmptyPatientListCRDT } from '#schemas/patient_list_crdt'
import db from '@adonisjs/lucid/services/db'

export default class PatientListCrdtsController {
  /**
   * Create a new patient list with initialized CRDT document
   */
  async create({ request, response, auth, bouncer }: HttpContext) {
    await auth.authenticate()
    const user = auth.user!

    // Get tenant from request params or header
    const tenantId = request.param('tenantId') || request.header('X-Tenant-Id')
    if (!tenantId) {
      return response.badRequest({ error: 'Tenant ID is required' })
    }

    // Verify user has access to this tenant
    await bouncer.with('TenantPolicy').authorize('view', tenantId)

    // Get request data
    const {
      displayName,
      urlSafeName,
      isPublic = false,
    } = request.only(['displayName', 'urlSafeName', 'isPublic'])

    try {
      // Create new CRDT model
      const model = Model.create(patientListSchema)

      // Initialize with data using the helper function
      const initialData = createEmptyPatientListCRDT({
        id: crypto.randomUUID(),
        name: displayName,
        owner_id: user.id,
        url_safe_name: urlSafeName,
      })

      model.api.root(initialData)

      // Convert to binary for storage
      const crdtBinary = model.toBinary()

      // Create patient list in database
      const patientList = await PatientList.create({
        displayName,
        urlSafeName,
        tenantId: Number(tenantId),
        isPublic,
        createdByUserId: user.id,
        crdtDocument: Buffer.from(crdtBinary),
        crdtVersion: (model.clock.tick(0) as any).time || 0,
      })

      return response.created({
        success: true,
        data: {
          id: patientList.id,
          displayName: patientList.displayName,
          urlSafeName: patientList.urlSafeName,
          crdtVersion: patientList.crdtVersion,
        },
      })
    } catch (error) {
      console.error('Failed to create patient list with CRDT:', error)
      return response.internalServerError({ error: 'Failed to create patient list' })
    }
  }

  /**
   * Get CRDT state for a patient list
   */
  async getCRDTState({ params, request, response, auth, bouncer }: HttpContext) {
    await auth.authenticate()

    const { urlSafeName } = params
    const tenantUrlSafeName = request.param('org')

    try {
      // Find the tenant first
      const tenant = await db.from('tenants').where('url_safe_name', tenantUrlSafeName).first()

      if (!tenant) {
        return response.notFound({ error: 'Tenant not found' })
      }

      // Find the patient list within this tenant
      let patientList = await PatientList.query()
        .where('urlSafeName', urlSafeName)
        .where('tenantId', tenant.id)
        .preload('tenant')
        .first()

      if (!patientList) {
        // For "default" list, create it automatically if it doesn't exist
        if (urlSafeName === 'default') {
          // Verify user has access to this tenant
          const userTenants = await auth.user!.related('tenants').query()
          const userHasAccess = userTenants.some((t) => t.urlSafeName === tenantUrlSafeName)

          if (!userHasAccess) {
            return response.forbidden({ error: 'Access denied to this tenant' })
          }

          // Create default patient list
          const model = Model.create(patientListSchema as any)
          const initialData = createEmptyPatientListCRDT({
            id: crypto.randomUUID(),
            name: 'Default Patient List',
            owner_id: auth.user!.id,
            url_safe_name: 'default',
          })
          model.api.root(initialData)
          const crdtBinary = model.toBinary()

          patientList = await PatientList.create({
            displayName: 'Default Patient List',
            urlSafeName: 'default',
            tenantId: tenant.id,
            isPublic: false,
            createdByUserId: auth.user!.id,
            crdtDocument: Buffer.from(crdtBinary),
            crdtVersion: (model.clock.tick(0) as any).time || 0,
          })

          await patientList.load('tenant')
        } else {
          return response.notFound({ error: 'Patient list not found' })
        }
      }

      // Check authorization
      await bouncer.with('PatientListPolicy').authorize('view', patientList)

      // Return CRDT binary data
      if (!patientList.crdtDocument) {
        // Return empty array if no CRDT document exists yet
        return response.ok({ crdt: [] })
      }

      // Convert Buffer to array of numbers for JSON serialization
      const crdtArray = Array.from(patientList.crdtDocument)

      return response.ok({
        crdt: crdtArray,
        version: patientList.crdtVersion,
      })
    } catch (error) {
      console.error('Failed to get CRDT state:', error)
      return response.internalServerError({ error: 'Failed to get CRDT state' })
    }
  }

  /**
   * Apply patches to CRDT and broadcast changes
   */
  async applyPatches({ request, params, response, auth, bouncer }: HttpContext) {
    await auth.authenticate()
    const user = auth.user!

    const { urlSafeName } = params
    const { patches, version } = request.only(['patches', 'version'])

    if (!patches || !Array.isArray(patches)) {
      return response.badRequest({ error: 'Patches array is required' })
    }

    try {
      const tenantUrlSafeName = request.param('org')

      // Find the tenant first
      const tenant = await db.from('tenants').where('url_safe_name', tenantUrlSafeName).first()

      if (!tenant) {
        return response.notFound({ error: 'Tenant not found' })
      }

      // Find the patient list within this tenant
      const patientList = await PatientList.query()
        .where('urlSafeName', urlSafeName)
        .where('tenantId', tenant.id)
        .preload('tenant')
        .first()

      if (!patientList) {
        return response.notFound({ error: 'Patient list not found' })
      }

      // Check authorization
      await bouncer.with('PatientListPolicy').authorize('update', patientList)

      // Load current CRDT state
      if (!patientList.crdtDocument) {
        return response.badRequest({ error: 'Patient list has no CRDT document' })
      }

      // Load model from binary
      const model = Model.fromBinary(new Uint8Array(patientList.crdtDocument)) as any
      // Ensure model has the correct schema structure
      if (!model.view) {
        return response.badRequest({ error: 'Invalid CRDT document structure' })
      }

      // Apply patches
      for (const patchData of patches) {
        const patch = decodeVerbose(patchData)
        model.applyPatch(patch)
      }

      // Validate the CRDT structure after patches
      const view = model.view()
      if (view.patients && Array.isArray(view.patients)) {
        for (const patient of view.patients) {
          // Check for patch operation data that shouldn't be in patient objects
          const invalidKeys = Object.keys(patient).filter(key => {
            // Numeric string keys like "0", "1" etc are signs of patch corruption
            return /^\d+$/.test(key)
          })
          
          if (invalidKeys.length > 0) {
            console.error('CRDT validation failed: Patient object contains patch operation keys:', {
              patientId: patient.id,
              invalidKeys,
              patient
            })
            return response.badRequest({ 
              error: 'CRDT validation failed: Patient data corrupted with patch operations',
              invalidKeys,
              patientId: patient.id
            })
          }
        }
      }

      // Save updated CRDT
      const updatedBinary = model.toBinary()
      patientList.crdtDocument = Buffer.from(updatedBinary)
      patientList.crdtVersion = (model.clock.tick(0) as any).time || 0
      await patientList.save()

      // Broadcast patches to all connected clients
      const channelName = `org/${patientList.tenant.urlSafeName}/patient-lists/${urlSafeName}`
      transmit.broadcast(channelName, {
        patches,
        version: (model.clock.tick(0) as any).time || 0,
        userId: user.id,
      })

      return response.ok({
        success: true,
        version: patientList.crdtVersion,
      })
    } catch (error) {
      console.error('Failed to apply patches:', error)
      return response.internalServerError({ error: 'Failed to apply patches' })
    }
  }
}
