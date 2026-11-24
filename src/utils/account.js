const USERS_KEY = 'pct-users'
const LOCAL_SESSION_KEY = 'pct-user'
const TEMP_SESSION_KEY = 'pct-session-user'

function readUsers(storage) {
  try {
    return JSON.parse(storage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

function normalizePhone(value = '') {
  return String(value).replace(/[\s().-]/g, '')
}

export function saveAccountSession(localStorage, sessionStorage, account, remember) {
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  target.setItem(remember ? LOCAL_SESSION_KEY : TEMP_SESSION_KEY, JSON.stringify(account))
  other.removeItem(remember ? TEMP_SESSION_KEY : LOCAL_SESSION_KEY)
}

export function restoreAccountSession(localStorage, sessionStorage) {
  const storedLocally = Boolean(localStorage.getItem(LOCAL_SESSION_KEY))
  const storage = storedLocally ? localStorage : sessionStorage
  const key = storedLocally ? LOCAL_SESSION_KEY : TEMP_SESSION_KEY
  let account
  try {
    account = JSON.parse(storage.getItem(key) || 'null')
  } catch {
    storage.removeItem(key)
    return null
  }
  if (!account) return null
  const { password, passwordHash, passwordSalt, ...safeAccount } = account
  if (password || passwordHash || passwordSalt) storage.setItem(key, JSON.stringify(safeAccount))
  return safeAccount
}

export function clearAccountSession(localStorage, sessionStorage) {
  localStorage.removeItem(LOCAL_SESSION_KEY)
  sessionStorage.removeItem(TEMP_SESSION_KEY)
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createPasswordHash(password, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) {
    throw new Error('Thiết bị không hỗ trợ mã hóa mật khẩu an toàn trong trình duyệt này.')
  }

  const salt = cryptoApi.getRandomValues(new Uint8Array(16))
  const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const digest = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256)

  return { passwordHash: toHex(digest), passwordSalt: toHex(salt) }
}

async function verifyPassword(password, saltHex, expectedHash, cryptoApi) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) || [], byte => parseInt(byte, 16))
  const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const digest = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256)
  return toHex(digest) === expectedHash
}

export async function registerAccount(storage, details, cryptoApi = globalThis.crypto) {
  const users = readUsers(storage)
  const email = normalizeEmail(details.email)

  if (users.some(user => normalizeEmail(user.email) === email)) {
    throw new Error('Email này đã được đăng ký.')
  }

  const credentials = await createPasswordHash(details.password, cryptoApi)
  const account = {
    name: details.name.trim(),
    email,
    phone: normalizePhone(details.phone),
    ...credentials,
    createdAt: new Date().toISOString(),
  }

  storage.setItem(USERS_KEY, JSON.stringify([...users, account]))
  return { name: account.name, email: account.email, phone: account.phone }
}

export async function authenticateAccount(storage, identifier, password, cryptoApi = globalThis.crypto) {
  const lookup = identifier.trim().toLowerCase()
  const users = readUsers(storage)
  const account = users.find(user =>
    normalizeEmail(user.email) === lookup || normalizePhone(user.phone || '') === normalizePhone(lookup),
  )

  if (!account) throw new Error('Tài khoản chưa được đăng ký.')

  let valid = false
  if (account.passwordHash && account.passwordSalt) {
    valid = await verifyPassword(password, account.passwordSalt, account.passwordHash, cryptoApi)
  } else if (account.password) {
    // Migrate legacy demo accounts to a salted hash after successful sign-in.
    valid = account.password === password
    if (valid) {
      const credentials = await createPasswordHash(password, cryptoApi)
      const migrated = users.map(user => user === account
        ? { ...user, ...credentials, password: undefined }
        : user)
      storage.setItem(USERS_KEY, JSON.stringify(migrated))
    }
  }

  if (!valid) throw new Error('Mật khẩu chưa chính xác.')
  return { name: account.name, email: account.email, phone: account.phone || '' }
}
