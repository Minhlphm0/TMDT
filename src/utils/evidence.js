import { createId } from './store.js'

export const EVIDENCE_LIMITS = Object.freeze({ imageBytes: 3 * 1024 * 1024, videoBytes: 12 * 1024 * 1024, totalBytes: 20 * 1024 * 1024, files: 5 })
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const videoTypes = new Set(['video/mp4', 'video/webm'])

export function validateEvidenceFiles(files) {
  const list = [...files]
  if (list.length > EVIDENCE_LIMITS.files) return { valid: false, error: `Chỉ có thể đính kèm tối đa ${EVIDENCE_LIMITS.files} tệp.` }
  let total = 0
  for (const file of list) {
    const allowed = imageTypes.has(file.type) || videoTypes.has(file.type)
    if (!allowed) return { valid: false, error: 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc video MP4, WebM.' }
    const limit = imageTypes.has(file.type) ? EVIDENCE_LIMITS.imageBytes : EVIDENCE_LIMITS.videoBytes
    if (file.size > limit) return { valid: false, error: `Tệp ${file.name} vượt quá giới hạn ${Math.round(limit / 1024 / 1024)} MB.` }
    total += file.size
  }
  if (total > EVIDENCE_LIMITS.totalBytes) return { valid: false, error: 'Tổng dung lượng tệp không được vượt quá 20 MB.' }
  return { valid: true }
}

function openEvidenceDb(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return Promise.reject(new Error('Trình duyệt không hỗ trợ IndexedDB; tệp chưa được lưu.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pct-store-evidence', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Không mở được kho tệp minh chứng.'))
  })
}

export async function saveEvidenceFiles(files, indexedDB = globalThis.indexedDB) {
  const validation = validateEvidenceFiles(files)
  if (!validation.valid) throw new Error(validation.error)
  if (!files.length) return []
  const db = await openEvidenceDb(indexedDB)
  const records = files.map(file => ({
    id: createId('EVD'), blob: file, name: file.name, type: file.type, size: file.size,
    savedAt: new Date().toISOString(),
  }))
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite')
      for (const record of records) tx.objectStore('files').put(record)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('Không lưu được tệp minh chứng.'))
      tx.onabort = () => reject(tx.error || new Error('Đã hủy lưu tệp minh chứng.'))
    })
    return records.map(record => { const metadata = { ...record }; delete metadata.blob; return metadata })
  } catch (error) {
    throw new Error(`${error.message} Tệp chưa được lưu lâu dài.`)
  } finally {
    db.close()
  }
}

export async function getEvidenceFile(id, indexedDB = globalThis.indexedDB) {
  const db = await openEvidenceDb(indexedDB)
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error || new Error('Không đọc được tệp minh chứng.'))
    })
  } finally { db.close() }
}

export async function deleteEvidenceFiles(ids, indexedDB = globalThis.indexedDB) {
  if (!ids.length) return
  const db = await openEvidenceDb(indexedDB)
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite')
      ids.forEach(id => tx.objectStore('files').delete(id))
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('Không xóa được tệp minh chứng.'))
    })
  } finally { db.close() }
}
