import { test } from '@japa/runner'
import {
  createPatientValidator,
  updatePatientValidator,
  patientParamsValidator,
} from '#validators/patient'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Patient validator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('createPatientValidator accepts any data with valid params', async ({ assert }) => {
    const validData = {
      data: {
        someField: 'any value',
        nestedField: {
          canBeAnything: true,
        },
      },
      params: {
        org: 'test-org',
        list: 'test-list',
      },
    }

    const output = await createPatientValidator.validate(validData)
    assert.properties(output, ['data', 'params'])
    assert.deepEqual(output.data, validData.data)
    assert.equal(output.params.org, validData.params.org)
    assert.equal(output.params.list, validData.params.list)
  })

  test('createPatientValidator rejects invalid org format', async ({ assert }) => {
    const invalidData = {
      data: {},
      params: {
        org: 'Invalid Org!',
        list: 'test-list',
      },
    }

    try {
      await createPatientValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.org'))
    }
  })

  test('updatePatientValidator accepts any data with valid params', async ({ assert }) => {
    const validData = {
      data: {
        someField: 'any value',
        canBeComplex: {
          nested: ['arrays', 'objects'],
          anything: true,
        },
      },
      params: {
        org: 'test-org',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    }

    const output = await updatePatientValidator.validate(validData)
    assert.properties(output, ['data', 'params'])
    assert.deepEqual(output.data, validData.data)
    assert.equal(output.params.org, validData.params.org)
    assert.equal(output.params.id, validData.params.id)
  })

  test('updatePatientValidator rejects invalid UUID', async ({ assert }) => {
    const invalidData = {
      data: {},
      params: {
        org: 'test-org',
        id: 'not-a-uuid',
      },
    }

    try {
      await updatePatientValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.id'))
    }
  })

  test('patientParamsValidator accepts valid params', async ({ assert }) => {
    const validData = {
      params: {
        org: 'test-org',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    }

    const output = await patientParamsValidator.validate(validData)
    assert.properties(output.params, ['org', 'id'])
    assert.equal(output.params.org, validData.params.org)
    assert.equal(output.params.id, validData.params.id)
  })

  test('patientParamsValidator rejects invalid org format', async ({ assert }) => {
    const invalidData = {
      params: {
        org: 'Invalid Org!',
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    }

    try {
      await patientParamsValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.org'))
    }
  })

  test('patientParamsValidator rejects invalid UUID format', async ({ assert }) => {
    const invalidData = {
      params: {
        org: 'test-org',
        id: 'not-a-uuid',
      },
    }

    try {
      await patientParamsValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.id'))
    }
  })
})
