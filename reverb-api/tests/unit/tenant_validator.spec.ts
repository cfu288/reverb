import { test } from '@japa/runner'
import { tenantParamValidator, tenantValidator } from '#validators/tenant'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Tenant validator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

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

  test('tenantValidator accepts valid tenant data', async ({ assert }) => {
    const validData = {
      display_name: 'Test Organization',
      url_safe_name: 'test-org',
    }

    const output = await tenantValidator.validate(validData)
    assert.properties(output, ['display_name', 'url_safe_name'])
    assert.equal(output.display_name, validData.display_name)
    assert.equal(output.url_safe_name, validData.url_safe_name)
  })

  test('tenantValidator rejects invalid display_name', async ({ assert }) => {
    const invalidData = {
      display_name: '', // Empty string
      url_safe_name: 'test-org',
    }

    try {
      await tenantValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'display_name'))
    }
  })

  test('tenantValidator rejects invalid url_safe_name format', async ({ assert }) => {
    const invalidData = {
      display_name: 'Test Organization',
      url_safe_name: 'Invalid Name With Spaces!',
    }

    try {
      await tenantValidator.validate(invalidData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.exists(error.messages.find((m: { field: string }) => m.field === 'url_safe_name'))
    }
  })
})
