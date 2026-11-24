import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { ADMIN_DEMO_CREDENTIALS, authenticateDemoAdmin, clearAdminSession, getAdminSession, hasAdminAccess, saveAdminSession } from './adminAuth.js'

class MemoryStorage { values=new Map();getItem(key){return this.values.get(key)??null}setItem(key,value){this.values.set(key,String(value))}removeItem(key){this.values.delete(key)} }

test('demo admin authentication stores only a salted hash and keeps session separate from customer accounts', async () => {
  const local = new MemoryStorage(), session = new MemoryStorage()
  const admin = await authenticateDemoAdmin(local, ADMIN_DEMO_CREDENTIALS.email, ADMIN_DEMO_CREDENTIALS.password, webcrypto)
  assert.equal(admin.role, 'admin')
  assert.equal(Object.hasOwn(admin, 'passwordHash'), false)
  const stored = JSON.parse(local.getItem('pct-admin-accounts'))[0]
  assert.ok(stored.passwordHash)
  assert.ok(stored.passwordSalt)
  assert.equal(Object.hasOwn(stored, 'password'), false)
  await assert.rejects(authenticateDemoAdmin(local, ADMIN_DEMO_CREDENTIALS.email, 'incorrect', webcrypto))
  saveAdminSession(session, admin)
  assert.equal(getAdminSession(session).email, admin.email)
  clearAdminSession(session)
  assert.equal(getAdminSession(session), null)
  assert.equal(hasAdminAccess({ email: 'customer@example.com', role: 'customer' }), false)
})
