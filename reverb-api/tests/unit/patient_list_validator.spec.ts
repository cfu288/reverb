import { test } from '@japa/runner'
import {
  createPatientListValidator,
  patientListParamsValidator,
  tenantParamValidator,
} from '#validators/patient_list'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Patient list validator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('createPatientListValidator accepts valid data', async ({ assert }) => {
    const validData = {
      display_name: 'Test Patient List',
      url_safe_name: 'test-patient-list',
      is_public: true,
      params: {
        org: 'test-org',
      },
    }

    const output = await createPatientListValidator.validate(validData)
    assert.properties(output, ['display_name', 'url_safe_name', 'is_public', 'params'])
    assert.equal(output.display_name, validData.display_name)
    assert.equal(output.url_safe_name, validData.url_safe_name)
    assert.equal(output.is_public, validData.is_public)
    assert.equal(output.params.org, validData.params.org)
  })

  test('createPatientListValidator rejects invalid display_name', async ({ assert }) => {
    const invalidData = {
      display_name: '', // Empty string
      url_safe_name: 'test-patient-list',
      params: {
        org: 'test-org',
      },
    }

    try {
      await createPatientListValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'display_name'))
    }
  })

  test('createPatientListValidator rejects invalid patient_list format', async ({ assert }) => {
    const invalidData = {
      display_name: 'Test Patient List',
      url_safe_name: 'Invalid Name With Spaces!',
      params: {
        org: 'test-org',
      },
    }

    try {
      await createPatientListValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'url_safe_name'))
    }
  })

  test('patientListParamsValidator accepts valid params', async ({ assert }) => {
    const validData = {
      params: {
        org: 'test-org',
        url_safe_name: 'test-list',
      },
    }

    const output = await patientListParamsValidator.validate(validData)
    assert.properties(output.params, ['org', 'url_safe_name'])
    assert.equal(output.params.org, validData.params.org)
    assert.equal(output.params.url_safe_name, validData.params.url_safe_name)
  })

  test('patientListParamsValidator rejects invalid org format', async ({ assert }) => {
    const invalidData = {
      params: {
        org: 'Invalid Org!',
        url_safe_name: 'test-list',
      },
    }

    try {
      await patientListParamsValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.org'))
    }
  })

  test('tenantParamValidator accepts valid org param', async ({ assert }) => {
    const validData = {
      params: {
        org: 'test-org',
      },
    }

    const output = await tenantParamValidator.validate(validData)
    assert.properties(output.params, ['org'])
    assert.equal(output.params.org, validData.params.org)
  })

  test('tenantParamValidator rejects invalid org format', async ({ assert }) => {
    const invalidData = {
      params: {
        org: 'Invalid Org!',
      },
    }

    try {
      await tenantParamValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'params.org'))
    }
  })
})
