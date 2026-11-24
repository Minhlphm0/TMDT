import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BACKUP_KEY, LEGACY_COLLECTION_KEYS, RECONCILE_BACKUP_KEY, STORE_KEY, STORE_VERSION, VERSION_1_BACKUP_KEY, VERSION_2_BACKUP_KEY,
  createId, demoFixtures, initializeStore, isRepairWarrantyOpen, isReturnWindowOpen,
  isWithinDays, readCollection, recoverStoreFromBackup, updateCollection, validateCollection, writeCollections,
} from './store.js'

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

test('migrates legacy collections, keeps exact backups, and leaves legacy keys intact', () => {
  const storage = new MemoryStorage()
  const orders = [{ id: 'old-order', total: 1250000 }]
  const cart = [{ id: 4, qty: 2 }]
  storage.setItem('pct-orders', JSON.stringify(orders))
  storage.setItem('pct-cart', JSON.stringify(cart))
  storage.setItem('pct-users', JSON.stringify([{ email: 'legacy@example.com', passwordHash: 'hash' }]))

  const store = initializeStore(storage)
  assert.equal(store.version, STORE_VERSION)
  assert.deepEqual(readCollection('orders', storage), orders)
  assert.deepEqual(readCollection('cart', storage), cart)
  assert.deepEqual(readCollection('accounts', storage), [{ email: 'legacy@example.com', passwordHash: 'hash' }])
  assert.deepEqual(JSON.parse(storage.getItem(BACKUP_KEY)).values['pct-orders'], JSON.stringify(orders))
  assert.equal(storage.getItem('pct-orders'), JSON.stringify(orders))
  assert.ok(storage.getItem(STORE_KEY))
})

test('migration is idempotent and versioned writes keep compatible legacy reads current', () => {
  const storage = new MemoryStorage()
  storage.setItem('pct-favorites', JSON.stringify([1, 3]))
  initializeStore(storage)
  storage.setItem('pct-favorites', JSON.stringify([99]))
  assert.deepEqual(readCollection('favorites', storage), [1, 3])
  assert.deepEqual(initializeStore(storage).collections.favorites, [1, 3])

  updateCollection('favorites', current => [...current, 5], storage)
  assert.deepEqual(readCollection('favorites', storage), [1, 3, 5])
  assert.deepEqual(JSON.parse(storage.getItem('pct-favorites')), [1, 3, 5])
  assert.equal(initializeStore(storage).revision, 1)
})

test('reconciles legacy-only accounts and orders without replacing canonical records', () => {
  const storage = new MemoryStorage()
  const canonicalAccount = { id: 'USR-1', email: 'same@example.com', name: 'Canonical' }
  const canonicalOrder = { id: 'ORD-1', total: 2000 }
  const legacyAccounts = [
    { email: 'SAME@example.com', name: 'Older copy' },
    { email: 'recovered@example.com', name: 'Recovered account' },
  ]
  const legacyOrders = [{ id: 'ORD-1', total: 1000 }, { id: 'ORD-2', total: 3000 }]
  storage.setItem(STORE_KEY, JSON.stringify({ version: STORE_VERSION, revision: 4, collections: { accounts: [canonicalAccount], orders: [canonicalOrder] } }))
  storage.setItem('pct-users', JSON.stringify(legacyAccounts))
  storage.setItem('pct-orders', JSON.stringify(legacyOrders))
  const originalStore = storage.getItem(STORE_KEY)

  const migrated = initializeStore(storage)
  assert.equal(migrated.revision, 5)
  assert.deepEqual(migrated.collections.accounts, [canonicalAccount, legacyAccounts[1]])
  assert.deepEqual(migrated.collections.orders, [canonicalOrder, legacyOrders[1]])
  assert.deepEqual(JSON.parse(storage.getItem('pct-users')), migrated.collections.accounts)
  assert.deepEqual(JSON.parse(storage.getItem('pct-orders')), migrated.collections.orders)
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).values['pct-users'], JSON.stringify(legacyAccounts))
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).values['pct-orders'], JSON.stringify(legacyOrders))
  assert.equal(JSON.parse(storage.getItem(RECONCILE_BACKUP_KEY)).values['pct-users'], JSON.stringify(legacyAccounts))
  assert.equal(JSON.parse(storage.getItem(RECONCILE_BACKUP_KEY)).store, originalStore)
  assert.equal(initializeStore(storage).collections.accounts.length, 2)
  assert.equal(initializeStore(storage).collections.orders.length, 2)
  assert.equal(initializeStore(storage).revision, 5)
})

test('invalid legacy JSON is preserved in the backup and does not block other migrations', () => {
  const storage = new MemoryStorage()
  storage.setItem('pct-orders', '{broken json')
  storage.setItem('pct-cart', JSON.stringify([{ id: 2, qty: 1 }]))
  initializeStore(storage)
  assert.deepEqual(readCollection('orders', storage), [])
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).values['pct-orders'], '{broken json')
  assert.equal(storage.getItem('pct-orders'), '{broken json')
  assert.deepEqual(readCollection('cart', storage), [{ id: 2, qty: 1 }])
})

test('recovery preserves a damaged store and restores only missing legacy keys', () => {
  const storage = new MemoryStorage()
  storage.setItem('pct-orders', JSON.stringify([{ id: 'keep-me' }]))
  initializeStore(storage)
  storage.setItem(STORE_KEY, '{damaged')
  storage.removeItem('pct-orders')

  const recovered = recoverStoreFromBackup(storage)
  assert.equal(storage.getItem('pct-store-corrupt-backup-v1'), '{damaged')
  assert.deepEqual(readCollection('orders', storage), [{ id: 'keep-me' }])
  assert.equal(recovered.version, STORE_VERSION)
})

test('version 1 namespace migrates forward with an exact preserved copy', () => {
  const storage = new MemoryStorage()
  const v1 = { version: 1, revision: 3, collections: { orders: [{ id: 'v1-order' }] } }
  storage.setItem(STORE_KEY, JSON.stringify(v1))
  const next = initializeStore(storage)
  assert.equal(next.version, STORE_VERSION)
  assert.deepEqual(next.collections.orders, v1.collections.orders)
  assert.deepEqual(JSON.parse(storage.getItem(VERSION_1_BACKUP_KEY)), v1)
})

test('version 2 migration backs up the exact store and adds empty inventory without inventing stock', () => {
  const storage = new MemoryStorage()
  const v2 = { version: 2, revision: 7, collections: { orders: [{ id: 'v2-order', status: 'shipped' }], accounts: [{ id: 'user-2' }] } }
  const original = JSON.stringify(v2)
  storage.setItem(STORE_KEY, original)
  const migrated = initializeStore(storage)
  assert.equal(migrated.version, STORE_VERSION)
  assert.deepEqual(migrated.collections.orders, v2.collections.orders)
  assert.deepEqual(migrated.collections.accounts, v2.collections.accounts)
  assert.deepEqual(migrated.collections.inventory, [])
  assert.deepEqual(migrated.collections.inventoryMovements, [])
  assert.equal(storage.getItem(VERSION_2_BACKUP_KEY), original)
  assert.equal(initializeStore(storage).revision, 7)
})

test('multi-collection write rolls the versioned snapshot back if a legacy mirror write fails', () => {
  class FailingStorage extends MemoryStorage {
    failKey = ''
    setItem(key, value) {
      if (this.failKey === key) { this.failKey = ''; throw new Error('quota') }
      super.setItem(key, value)
    }
  }
  const storage = new FailingStorage()
  initializeStore(storage)
  const before = storage.getItem(STORE_KEY)
  storage.failKey = 'pct-notifications'
  assert.throws(()=>writeCollections({ returnRequests: [{ id:'new' }], notifications: [{ id:'notice' }] },storage),/quota/)
  assert.equal(storage.getItem(STORE_KEY),before)
  assert.deepEqual(readCollection('returnRequests',storage),[])
  assert.deepEqual(readCollection('notifications',storage),[])
})

test('collection validation and demo fixtures are available without mixing demo records into customer data', () => {
  const storage = new MemoryStorage()
  assert.deepEqual(readCollection('orders', storage), [])
  assert.equal(validateCollection('accounts', ['invalid']).valid, false)
  assert.equal(validateCollection('favorites', [1, '2']).valid, true)
  assert.equal(demoFixtures.orders[0].isDemo, true)
  assert.equal(demoFixtures.repairs[0].isDemo, true)
  assert.deepEqual(Object.keys(LEGACY_COLLECTION_KEYS).includes('returnRequests'), true)
})

test('demo identifiers and return or repair warranty date checks are deterministic and boundary-aware', () => {
  const now = new Date('2026-03-10T12:00:00.000Z')
  assert.equal(createId('rt', now, () => 0), 'RT-MMKK5MO0-00000')
  assert.equal(isWithinDays('2026-03-03T12:00:00.000Z', 7, now), true)
  assert.equal(isWithinDays('2026-03-02T12:00:00.000Z', 7, now), false)
  assert.equal(isReturnWindowOpen({ status: 'delivered', deliveredAt: '2026-03-05T12:00:00.000Z' }, now), true)
  assert.equal(isReturnWindowOpen({ status: 'processing', deliveredAt: '2026-03-05T12:00:00.000Z' }, now), false)
  assert.equal(isRepairWarrantyOpen({ status: 'returned', handedOverAt: '2026-02-10T12:00:00.000Z', warrantyMonths: 3 }, now), true)
  assert.equal(isRepairWarrantyOpen({ status: 'returned', handedOverAt: '2025-02-10T12:00:00.000Z', warrantyMonths: 3 }, now), false)
})
