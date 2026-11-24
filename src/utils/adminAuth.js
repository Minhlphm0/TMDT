import { createPasswordHash } from './account.js'
import { readCollection, writeCollection } from './store.js'

export const ADMIN_DEMO_CREDENTIALS = Object.freeze({ email: 'admin@pctechstore.demo', password: 'Admin@PC2026' })
export const ADMIN_SESSION_KEY = 'pct-admin-session'

export async function ensureDemoAdmin(storage = globalThis.localStorage, cryptoApi = globalThis.crypto) {
  const admins = readCollection('adminAccounts', storage)
  if (admins.some(admin => admin.email === ADMIN_DEMO_CREDENTIALS.email)) return admins
  const credentials = await createPasswordHash(ADMIN_DEMO_CREDENTIALS.password, cryptoApi)
  const admin = { id: 'DEMO-ADMIN-001', name: 'Quản trị viên demo', email: ADMIN_DEMO_CREDENTIALS.email, role: 'admin', isDemo: true, ...credentials, createdAt: new Date().toISOString() }
  writeCollection('adminAccounts', [...admins, admin], storage)
  return [...admins, admin]
}

function toHex(buffer) { return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('') }

async function verify(password, account, cryptoApi) {
  if (!cryptoApi?.subtle) return false
  const salt = Uint8Array.from(account.passwordSalt.match(/.{2}/g) || [], byte => parseInt(byte, 16))
  const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const digest = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256)
  return toHex(digest) === account.passwordHash
}

export async function authenticateDemoAdmin(storage, email, password, cryptoApi = globalThis.crypto) {
  const admins = await ensureDemoAdmin(storage, cryptoApi)
  const admin = admins.find(item => item.email === String(email).trim().toLowerCase())
  if (!admin || !await verify(password, admin, cryptoApi)) throw new Error('Thông tin đăng nhập Admin không chính xác.')
  const safeAdmin = { ...admin }
  delete safeAdmin.passwordHash
  delete safeAdmin.passwordSalt
  return safeAdmin
}

export function saveAdminSession(sessionStorage, admin) {
  if (!hasAdminAccess(admin)) throw new Error('Tài khoản không có quyền Admin.')
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin))
}

export function getAdminSession(sessionStorage = globalThis.sessionStorage) {
  try {
    const admin = JSON.parse(sessionStorage?.getItem(ADMIN_SESSION_KEY) || 'null')
    return hasAdminAccess(admin) ? admin : null
  } catch { return null }
}

export function clearAdminSession(sessionStorage = globalThis.sessionStorage) {
  sessionStorage?.removeItem(ADMIN_SESSION_KEY)
}

export function hasAdminAccess(account) {
  return Boolean(account && account.role === 'admin' && account.isDemo === true && typeof account.email === 'string')
}
