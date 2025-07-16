import User from '#models/user'
import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('hashes user password', async ({ assert }) => {
    const user = new User()
    user.username = `user_${Math.random().toString(36).substring(7)}`
    user.password_hash = `secret`
    user.email = `user_${Math.random().toString(36).substring(7)}@example.com`
    user.firstName = `firstName_${Math.random().toString(36).substring(7)}`
    user.lastName = `lastName_${Math.random().toString(36).substring(7)}`

    await user.save()

    assert.isTrue(hash.isValidHash(user.password_hash))
    assert.isTrue(await hash.verify(user.password_hash, `secret`))
  })

  test('serializes all keys to snake_case', async ({ assert }) => {
    const user = new User()
    user.username = `user_${Math.random().toString(36).substring(7)}`
    user.password_hash = `secret`
    user.email = `user_${Math.random().toString(36).substring(7)}@example.com`
    user.firstName = `firstName_${Math.random().toString(36).substring(7)}`
    user.lastName = `lastName_${Math.random().toString(36).substring(7)}`

    // check if all keys of serialized user are lowercase
    assert.isTrue(Object.keys(user.serialize()).every((key) => key === key.toLowerCase()))
  })
})
