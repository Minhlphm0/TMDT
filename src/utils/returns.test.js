import test from 'node:test'
import assert from 'node:assert/strict'
import { canRequestReturn, remainingReturnQuantity, returnDeadline } from './returns.js'
import { EVIDENCE_LIMITS, validateEvidenceFiles } from './evidence.js'

const now = new Date('2026-04-10T12:00:00.000Z')
const delivered = { id: 'ORDER-1', status: 'delivered', deliveredAt: '2026-04-08T12:00:00.000Z' }
const item = { id: 12, qty: 2 }

test('return window uses actual delivery date and demo duration, never order date', () => {
  assert.equal(returnDeadline(delivered, [], now).eligible, true)
  assert.equal(returnDeadline({ ...delivered, deliveredAt: '2026-04-01T12:00:00.000Z' }, [], now).eligible, false)
  assert.equal(returnDeadline({ ...delivered, status: 'processing' }, [], now).eligible, false)
  assert.equal(returnDeadline({ status: 'delivered', date: '2026-04-09' }, [], now).eligible, false)
  assert.equal(returnDeadline({ ...delivered, deliveredAt: '2026-04-08T12:00:00.000Z' }, [], now, 1).eligible, false)
})

test('return quantity accounts for active requests and ignores rejected ones', () => {
  const requests = [
    { orderId: 'ORDER-1', status: 'pending', products: [{ productId: 12, quantity: 1 }] },
    { orderId: 'ORDER-1', status: 'rejected', products: [{ productId: 12, quantity: 1 }] },
    { orderId: 'OTHER', status: 'approved', products: [{ productId: 12, quantity: 1 }] },
  ]
  assert.equal(remainingReturnQuantity(delivered, item, requests), 1)
  assert.equal(canRequestReturn(delivered, item, requests, now).eligible, false)
  assert.equal(canRequestReturn(delivered, item, requests, now).reason.includes('trùng'), true)
  assert.equal(remainingReturnQuantity(delivered, item, [...requests, { orderId: 'ORDER-1', status: 'refunded', products: [{ productId: 12, quantity: 1 }] }]), 0)
})

test('evidence validation rejects unsupported formats, oversized files and too many attachments', () => {
  assert.equal(validateEvidenceFiles([{ name: 'ok.jpg', type: 'image/jpeg', size: 100 }]).valid, true)
  assert.equal(validateEvidenceFiles([{ name: 'script.svg', type: 'image/svg+xml', size: 100 }]).valid, false)
  assert.equal(validateEvidenceFiles([{ name: 'large.mp4', type: 'video/mp4', size: EVIDENCE_LIMITS.videoBytes + 1 }]).valid, false)
  assert.equal(validateEvidenceFiles(Array.from({ length: EVIDENCE_LIMITS.files + 1 }, (_, i) => ({ name: `${i}.png`, type: 'image/png', size: 1 }))).valid, false)
  assert.equal(validateEvidenceFiles([{ name: 'a.png', type: 'image/png', size: 11 * 1024 * 1024 }, { name: 'b.png', type: 'image/png', size: 11 * 1024 * 1024 }]).valid, false)
})
