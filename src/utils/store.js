export const STORE_KEY = 'pct-store'
export const STORE_VERSION = 3
export const BACKUP_KEY = 'pct-legacy-backup-v1'
export const VERSION_1_BACKUP_KEY = 'pct-store-v1-backup'
export const VERSION_2_BACKUP_KEY = 'pct-store-v2-backup'
export const RECONCILE_BACKUP_KEY = 'pct-store-reconcile-backup-v1'
export const STORE_CHANGE_EVENT = 'pct-store-change'
export const DEMO_POLICY_CONFIG = Object.freeze({ returnWindowDays: 7, repairWarrantyMonths: 3 })

export const LEGACY_COLLECTION_KEYS = {
  accounts: 'pct-users',
  orders: 'pct-orders',
  cart: 'pct-cart',
  favorites: 'pct-favorites',
  compare: 'pct-compare',
  repairs: 'pct-repairs',
  returnRequests: 'pct-return-requests',
  warrantyRequests: 'pct-warranty-requests',
  notifications: 'pct-notifications',
  adminAccounts: 'pct-admin-accounts',
  inventory: 'pct-inventory',
  inventoryMovements: 'pct-inventory-movements',
}

const emptyCollections = () => Object.fromEntries(Object.keys(LEGACY_COLLECTION_KEYS).map(key => [key, []]))

export const demoFixtures = {
  adminProfile: { id: 'DEMO-ADMIN-001', email: 'admin-demo@pctech.local', role: 'admin', isDemo: true, authenticationConfigured: false },
  orders: [{
    id: 'DEMO-ORDER-001', isDemo: true, status: 'delivered',
    items: [{ id: 'DEMO-PRODUCT-001', name: 'Sản phẩm minh họa', qty: 1, price: 1000000 }],
    subtotal: 1000000, shipping: 0, total: 1000000,
    orderedAt: '2026-01-10T09:00:00.000Z', deliveredAt: '2026-01-12T09:00:00.000Z',
  }],
  repairs: [{
    id: 'DEMO-REPAIR-001', isDemo: true, status: 'returned',
    device: 'Laptop minh họa', service: 'Kiểm tra tổng quát',
    receivedAt: '2026-01-05T09:00:00.000Z', completedAt: '2026-01-06T09:00:00.000Z',
    handedOverAt: '2026-01-07T09:00:00.000Z', warrantyMonths: 0, history: [],
  }],
  returnRequests: [{
    id: 'DEMO-RETURN-001', isDemo: true, orderId: 'DEMO-ORDER-001', productId: 'DEMO-PRODUCT-001',
    reason: 'product-defect', status: 'pending-review', requestedAt: '2026-01-13T09:00:00.000Z',
    statusHistory: [{ status: 'pending-review', at: '2026-01-13T09:00:00.000Z' }],
  }],
  warrantyRequests: [{
    id: 'DEMO-WARRANTY-001', isDemo: true, repairId: 'DEMO-REPAIR-001',
    status: 'pending-review', requestedAt: '2026-01-09T09:00:00.000Z', statusHistory: [],
  }],
  notifications: [{
    id: 'DEMO-NOTIFICATION-001', isDemo: true, title: 'Yêu cầu minh họa đã được ghi nhận',
    message: 'Đây là thông báo mẫu; không gửi email hoặc tin nhắn thật.', read: false,
    relatedId: 'DEMO-RETURN-001', createdAt: '2026-01-13T09:00:00.000Z',
  }],
}

function parseJson(raw) {
  try { return { valid: true, value: raw === null ? undefined : JSON.parse(raw) } }
  catch { return { valid: false } }
}

function emptyStore() {
  const now = new Date().toISOString()
  return { version: STORE_VERSION, revision: 0, createdAt: now, updatedAt: now, collections: emptyCollections(), demoFixtures }
}

function validateStore(value) {
  if (!value || typeof value !== 'object' || ![1, 2, STORE_VERSION].includes(value.version) || !value.collections || typeof value.collections !== 'object') {
    throw new Error('Dữ liệu PC TECH STORE không đúng phiên bản hoặc bị lỗi. Dữ liệu gốc vẫn được giữ nguyên.')
  }
  return value
}

export function initializeStore(storage = globalThis.localStorage) {
  if (!storage) throw new Error('LocalStorage không khả dụng.')
  const currentRaw = storage.getItem(STORE_KEY)
  if (currentRaw !== null) {
    const current = parseJson(currentRaw)
    if (!current.valid) throw new Error('Không đọc được kho dữ liệu phiên bản. Dữ liệu gốc vẫn được giữ nguyên.')
    const store = validateStore(current.value)
    let changed = false
    if (store.version === 2 && storage.getItem(VERSION_2_BACKUP_KEY) === null) storage.setItem(VERSION_2_BACKUP_KEY, currentRaw)
    if (store.version === 1) {
      if (storage.getItem(VERSION_1_BACKUP_KEY) === null) storage.setItem(VERSION_1_BACKUP_KEY, currentRaw)
      store.version = STORE_VERSION
      store.migratedAt = new Date().toISOString()
      changed = true
    } else if (store.version === 2) {
      store.version = STORE_VERSION
      store.migratedAt = new Date().toISOString()
      changed = true
    }
    // Add newly introduced collections without replacing any existing collection.
    for (const name of Object.keys(LEGACY_COLLECTION_KEYS)) {
      if (!Object.hasOwn(store.collections, name)) {
        store.collections[name] = []
        changed = true
      }
    }
    if (!store.demoFixtures) { store.demoFixtures = demoFixtures; changed = true }
    // Recover records written by an older screen directly to the compatibility keys.
    // The versioned store remains authoritative for matching records; legacy-only
    // accounts/orders are appended by stable identity and never replace current data.
    const recovered = reconcileLegacyRecords(store, storage, ['accounts', 'orders'])
    if (recovered && storage.getItem(BACKUP_KEY) === null) {
      const values = Object.fromEntries(Object.values(LEGACY_COLLECTION_KEYS).map(key => [key, storage.getItem(key)]))
      storage.setItem(BACKUP_KEY, JSON.stringify({ capturedAt: new Date().toISOString(), values }))
    }
    if (recovered && storage.getItem(RECONCILE_BACKUP_KEY) === null) {
      const values = Object.fromEntries(Object.values(LEGACY_COLLECTION_KEYS).map(key => [key, storage.getItem(key)]))
      storage.setItem(RECONCILE_BACKUP_KEY, JSON.stringify({ capturedAt: new Date().toISOString(), store: currentRaw, values }))
    }
    if (recovered) {
      store.revision = (Number(store.revision) || 0) + 1
      store.updatedAt = new Date().toISOString()
    }
    changed ||= recovered
    if (changed) storage.setItem(STORE_KEY, JSON.stringify(store))
    if (recovered) {
      try { syncLegacyRecords(store, storage, ['accounts', 'orders']) } catch { /* the backed up canonical data remains readable */ }
    }
    return store
  }

  const legacySnapshot = Object.fromEntries(Object.entries(LEGACY_COLLECTION_KEYS)
    .map(([, key]) => [key, storage.getItem(key)]))
  if (storage.getItem(BACKUP_KEY) === null) {
    // Preserve exact serialized legacy values before attempting migration.
    storage.setItem(BACKUP_KEY, JSON.stringify({ capturedAt: new Date().toISOString(), values: legacySnapshot }))
  }

  const store = emptyStore()
  for (const [name, key] of Object.entries(LEGACY_COLLECTION_KEYS)) {
    const result = parseJson(legacySnapshot[key])
    if (result.valid && Array.isArray(result.value)) store.collections[name] = result.value
  }
  storage.setItem(STORE_KEY, JSON.stringify(store))
  return store
}

export function readStore(storage = globalThis.localStorage) {
  return initializeStore(storage)
}

export function readCollection(name, storage = globalThis.localStorage) {
  if (!Object.hasOwn(LEGACY_COLLECTION_KEYS, name)) throw new Error(`Không hỗ trợ nhóm dữ liệu: ${name}`)
  const store = readStore(storage)
  const value = store.collections[name]
  const validation = validateCollection(name, value)
  if (!validation.valid) throw new Error(`Dữ liệu ${name} không hợp lệ (${validation.reason}).`)
  return value
}

export function writeCollection(name, value, storage = globalThis.localStorage) {
  writeCollections({ [name]: value }, storage)
  return value
}

export function writeCollections(changes, storage = globalThis.localStorage) {
  for (const [name, value] of Object.entries(changes)) {
    if (!Object.hasOwn(LEGACY_COLLECTION_KEYS, name)) throw new Error(`Không hỗ trợ nhóm dữ liệu: ${name}`)
    const validation = validateCollection(name, value)
    if (!validation.valid) throw new TypeError(`Dữ liệu ${name} không hợp lệ (${validation.reason}).`)
  }
  const store = readStore(storage)
  const next = { ...store, revision: store.revision + 1, updatedAt: new Date().toISOString(), collections: { ...store.collections, ...changes } }
  const oldStore = storage.getItem(STORE_KEY)
  const oldLegacy = Object.fromEntries(Object.keys(changes).map(name => [LEGACY_COLLECTION_KEYS[name], storage.getItem(LEGACY_COLLECTION_KEYS[name])]))
  storage.setItem(STORE_KEY, JSON.stringify(next))
  try {
    // Keep legacy consumers working; the original snapshot is retained separately.
    for (const [name, value] of Object.entries(changes)) storage.setItem(LEGACY_COLLECTION_KEYS[name], JSON.stringify(value))
  } catch (error) {
    try { if (oldStore === null) storage.removeItem(STORE_KEY); else storage.setItem(STORE_KEY, oldStore) } catch {}
    for (const [key, value] of Object.entries(oldLegacy)) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value) } catch {}
    }
    throw error
  }
  dispatchStoreChange(Object.keys(changes))
  return next
}

function recordIdentity(name, record) {
  if (!record || typeof record !== 'object') return JSON.stringify(record)
  if (name === 'accounts') return String(record.email || record.username || record.id || JSON.stringify(record)).trim().toLowerCase()
  return String(record.id || JSON.stringify(record))
}

function reconcileLegacyRecords(store, storage, names) {
  let changed = false
  for (const name of names) {
    const key = LEGACY_COLLECTION_KEYS[name]
    const legacy = parseJson(storage.getItem(key))
    if (!legacy.valid || !Array.isArray(legacy.value)) continue
    const existing = store.collections[name] || []
    const known = new Set(existing.map(record => recordIdentity(name, record)))
    const additions = legacy.value.filter(record => {
      const identity = recordIdentity(name, record)
      if (known.has(identity)) return false
      known.add(identity)
      return true
    })
    if (additions.length) {
      store.collections[name] = [...existing, ...additions]
      changed = true
    }
  }
  return changed
}

function syncLegacyRecords(store, storage, names) {
  for (const name of names) {
    const key = LEGACY_COLLECTION_KEYS[name]
    const parsed = parseJson(storage.getItem(key))
    // Keep malformed legacy data intact so it can be inspected/recovered manually.
    if (parsed.valid && Array.isArray(parsed.value)) storage.setItem(key, JSON.stringify(store.collections[name]))
  }
}

function dispatchStoreChange(collections) {
  if (typeof globalThis.window === 'undefined' || typeof globalThis.CustomEvent !== 'function') return
  globalThis.window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT, { detail: { collections } }))
}

export function subscribeStore(listener, storage = globalThis.localStorage) {
  if (typeof globalThis.window === 'undefined') return () => {}
  const onLocalChange = event => listener(event)
  const onStorageChange = event => {
    if (event.storageArea !== storage) return
    if (event.key === STORE_KEY || Object.values(LEGACY_COLLECTION_KEYS).includes(event.key)) listener(event)
  }
  globalThis.window.addEventListener(STORE_CHANGE_EVENT, onLocalChange)
  globalThis.window.addEventListener('storage', onStorageChange)
  return () => {
    globalThis.window.removeEventListener(STORE_CHANGE_EVENT, onLocalChange)
    globalThis.window.removeEventListener('storage', onStorageChange)
  }
}

export function updateCollection(name, updater, storage = globalThis.localStorage) {
  if (typeof updater !== 'function') throw new TypeError('updater phải là một hàm.')
  return writeCollection(name, updater(readCollection(name, storage)), storage)
}

export function validateCollection(name, value) {
  if (!Object.hasOwn(LEGACY_COLLECTION_KEYS, name)) return { valid: false, reason: 'unknown-collection' }
  if (!Array.isArray(value)) return { valid: false, reason: 'not-an-array' }
  const identifiers = name === 'favorites' || name === 'compare'
  if (identifiers ? value.some(item => !['string', 'number'].includes(typeof item)) : value.some(item => item === null || typeof item !== 'object' || Array.isArray(item))) {
    return { valid: false, reason: identifiers ? 'invalid-identifier' : 'invalid-record' }
  }
  return { valid: true }
}

export function createId(prefix, now = new Date(), random = Math.random) {
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  if (!Number.isFinite(timestamp)) throw new TypeError('Thời điểm tạo mã không hợp lệ.')
  const suffix = Math.floor(random() * 0x1000000).toString(36).padStart(5, '0')
  return `${String(prefix).toUpperCase()}-${timestamp.toString(36).toUpperCase()}-${suffix.toUpperCase()}`
}

export function isWithinDays(startAt, days, now = new Date()) {
  const start = new Date(startAt).getTime()
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(current) || !Number.isFinite(days) || days < 0) return false
  const elapsed = current - start
  return elapsed >= 0 && elapsed <= days * 24 * 60 * 60 * 1000
}

export function isReturnWindowOpen(order, now = new Date(), days = DEMO_POLICY_CONFIG.returnWindowDays) {
  const delivered = ['delivered', 'đã giao'].includes(String(order?.status || '').toLowerCase())
  return delivered && Boolean(order.deliveredAt) && isWithinDays(order.deliveredAt, days, now)
}

export function isRepairWarrantyOpen(repair, now = new Date()) {
  if (!repair || repair.status !== 'returned' || !repair.handedOverAt || !Number.isFinite(Number(repair.warrantyMonths))) return false
  const expiresAt = new Date(repair.handedOverAt)
  if (!Number.isFinite(expiresAt.getTime()) || Number(repair.warrantyMonths) <= 0) return false
  expiresAt.setMonth(expiresAt.getMonth() + Number(repair.warrantyMonths))
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return Number.isFinite(current) && current >= new Date(repair.handedOverAt).getTime() && current <= expiresAt.getTime()
}

export function recoverStoreFromBackup(storage = globalThis.localStorage) {
  const backupResult = parseJson(storage.getItem(BACKUP_KEY))
  if (!backupResult.valid || !backupResult.value?.values) throw new Error('Không tìm thấy bản sao dữ liệu migration hợp lệ.')

  const damaged = storage.getItem(STORE_KEY)
  if (damaged !== null) {
    const damagedKey = 'pct-store-corrupt-backup-v1'
    if (storage.getItem(damagedKey) !== null) throw new Error('Đã có bản sao dữ liệu lỗi; không ghi đè bản sao đó.')
    storage.setItem(damagedKey, damaged)
    storage.removeItem(STORE_KEY)
  }

  for (const key of Object.values(LEGACY_COLLECTION_KEYS)) {
    if (storage.getItem(key) === null && typeof backupResult.value.values[key] === 'string') {
      storage.setItem(key, backupResult.value.values[key])
    }
  }
  return initializeStore(storage)
}
