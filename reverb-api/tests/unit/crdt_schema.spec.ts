import { test } from '@japa/runner'
import { patientListSchema } from '#schemas/patient_list_crdt'
import { Model } from 'json-joy/lib/json-crdt/model'

test.group('CRDT Schema', () => {
  test('should create a valid patient list model', async ({ assert }) => {
    // Test that the schema can be used to create a model
    const model = Model.create(patientListSchema)
    assert.exists(model)

    // Initialize with test data
    model.api.root({
      id: 'test-id',
      name: 'Test List',
      owner_id: 1,
      url_safe_name: 'test-list',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patients: [
        {
          id: 'patient-1',
          mrn: '12345',
          dob: '1990-01-01',
          first_name: 'John',
          last_name: 'Doe',
          location: 'Room 101',
          one_liner: 'Test patient',
          hpi: 'History of present illness',
          todos: [
            {
              id: 'todo-1',
              description: 'Test todo',
              due_date: '2024-01-20',
              status: 'OPEN',
            },
          ],
          labs: [
            {
              id: 'lab-1',
              display_name: 'CBC',
              units: 'cells/uL',
              display_value: '5.0',
              effective_datetime: '2024-01-19T10:00:00Z',
              value_number: 5.0,
              identifiers: [
                {
                  id: 'id-1',
                  system: 'powerchart-touch',
                },
              ],
            },
          ],
          vitals: [
            {
              id: 'vital-1',
              display_name: 'Blood Pressure',
              units: 'mmHg',
              display_value: '120/80',
              effective_datetime: '2024-01-19T10:00:00Z',
              identifiers: [
                {
                  id: 'id-1',
                  system: 'powerchart-touch',
                },
              ],
            },
          ],
          meds: [
            {
              id: 'med-1',
              name: 'Aspirin',
              route: 'PO',
              frequency: 'Daily',
              dose: 81,
              unit: 'mg',
            },
          ],
          assessment_and_plan: [
            {
              id: 'ap-1',
              assessment: 'Stable',
              plan: ['Continue current medications', 'Follow up in 1 week'],
              category: 'Cardiovascular',
            },
          ],
        },
      ],
      display_template_id: 'template-1',
      settings: {
        sort_order: 'location',
        filters: {
          locations: ['ICU', 'Ward A'],
          tags: ['urgent', 'review'],
        },
      },
    })

    // Verify the data was set correctly
    const data = model.view()
    assert.equal(data.name, 'Test List')
    assert.equal(data.patients.length, 1)
    assert.equal(data.patients[0].mrn, '12345')
    assert.equal(data.patients[0].todos.length, 1)
    assert.equal(data.patients[0].labs.length, 1)
    assert.equal(data.patients[0].vitals.length, 1)
    assert.equal(data.patients[0].meds.length, 1)
    assert.equal(data.patients[0].assessment_and_plan.length, 1)
  })

  test('should serialize and deserialize correctly', async ({ assert }) => {
    const model = Model.create(patientListSchema)

    model.api.root({
      id: 'test-id',
      name: 'Test List',
      owner_id: 1,
      url_safe_name: 'test-list',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patients: [],
    })

    // Convert to binary and back
    const binary = model.toBinary()
    const restored = Model.fromBinary(patientListSchema, binary)

    const originalData = model.view()
    const restoredData = restored.view()

    assert.deepEqual(restoredData, originalData)
  })
})
