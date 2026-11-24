import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { authenticateAccount, clearAccountSession, registerAccount, restoreAccountSession, saveAccountSession } from './account.js'
import { writeCollection } from './store.js'

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

test('registers with salted hash, rejects duplicate email, and signs in by email or phone', async () => {
  const storage = new MemoryStorage()
  const form = { name: 'Nguyễn An', email: 'AN@example.com', phone: '090 123 4567', password: 'PcTech!2026' }

  const account = await registerAccount(storage, form, webcrypto)
  const stored = JSON.parse(storage.getItem('pct-users'))[0]

  assert.equal(account.email, 'an@example.com')
  assert.ok(stored.passwordHash)
  assert.ok(stored.passwordSalt)
  assert.equal(Object.hasOwn(stored, 'password'), false)
  await assert.rejects(registerAccount(storage, form, webcrypto), /đã được đăng ký/)
  assert.equal((await authenticateAccount(storage, 'AN@example.com', form.password, webcrypto)).name, form.name)
  assert.equal((await authenticateAccount(storage, '0901234567', form.password, webcrypto)).email, account.email)
  await assert.rejects(authenticateAccount(storage, form.email, 'wrong-password', webcrypto), /chưa chính xác/)
  await assert.rejects(authenticateAccount(storage, 'missing@example.com', form.password, webcrypto), /chưa được đăng ký/)
})

test('migrates legacy demo plaintext credentials after a valid sign-in', async () => {
  const storage = new MemoryStorage()
  storage.setItem('pct-users', JSON.stringify([{ name: 'Legacy', email: 'legacy@example.com', password: 'old-secret' }]))

  await authenticateAccount(storage, 'legacy@example.com', 'old-secret', webcrypto)
  const migrated = JSON.parse(storage.getItem('pct-users'))[0]
  assert.ok(migrated.passwordHash)
  assert.equal(Object.hasOwn(migrated, 'password'), false)
})

test('remember choice survives reload in the matching storage and logout clears both', () => {
  const local = new MemoryStorage()
  const session = new MemoryStorage()
  const account = { name: 'Test User', email: 'test@example.com' }

  saveAccountSession(local, session, account, true)
  assert.deepEqual(restoreAccountSession(local, session), account)
  assert.equal(session.getItem('pct-session-user'), null)

  saveAccountSession(local, session, account, false)
  assert.equal(local.getItem('pct-user'), null)
  assert.deepEqual(restoreAccountSession(local, session), account)

  clearAccountSession(local, session)
  assert.equal(restoreAccountSession(local, session), null)
})

test('registration survives repeated logout and sign-in with a stable account identity', async () => {
  const local = new MemoryStorage()
  const session = new MemoryStorage()
  const form = { name: 'Customer A', email: 'customer.a@example.com', phone: '0901234567', password: 'PcTech!2026' }
  const registered = await registerAccount(local, form, webcrypto)
  saveAccountSession(local, session, registered, true)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    clearAccountSession(local, session)
    assert.equal(JSON.parse(local.getItem('pct-users')).length, 1)
    const signedIn = await authenticateAccount(local, 'CUSTOMER.A@EXAMPLE.COM', form.password, webcrypto)
    assert.equal(signedIn.id, registered.id)
    assert.equal(signedIn.userId, registered.id)
    saveAccountSession(local, session, signedIn, true)
    assert.equal(restoreAccountSession(local, session).id, registered.id)
  }
})

test('legacy username sign-in resolves the account in the canonical store', async () => {
  const storage = new MemoryStorage()
  const form = { name: 'Named User', email: 'named@example.com', phone: '0905555666', password: 'PcTech!2026' }
  const registered = await registerAccount(storage, form, webcrypto)
  const accounts = JSON.parse(storage.getItem('pct-users'))
  accounts[0].username = 'named-user'
  writeCollection('accounts', accounts, storage)

  const signedIn = await authenticateAccount(storage, 'NAMED-USER', form.password, webcrypto)
  assert.equal(signedIn.email, registered.email)
  assert.equal(signedIn.id, registered.id)
})
