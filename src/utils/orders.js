import { createId } from './store.js'

export const ORDER_STATUS_LABELS = Object.freeze({
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý',
  shipping: 'Đang vận chuyển', delivered: 'Đã giao hàng', cancelled: 'Đã hủy',
})
export const ORDER_TRANSITIONS = Object.freeze({
  pending: ['confirmed'], confirmed: ['processing'], processing: ['shipping'],
  shipping: ['delivered'], delivered: [], cancelled: [],
})
export const CANCELLABLE_ORDER_STATUSES = Object.freeze(['pending', 'confirmed', 'processing'])

export function normalizeOrderStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'shipped') return 'shipping'
  if (value === 'đang vận chuyển') return 'shipping'
  if (value === 'đã giao') return 'delivered'
  if (value === 'đã hủy') return 'cancelled'
  if (value === 'chờ xác nhận') return 'pending'
  if (value === 'đã xác nhận') return 'confirmed'
  if (value === 'đang xử lý') return 'processing'
  return Object.hasOwn(ORDER_STATUS_LABELS, value) ? value : value
}

export function allowedOrderTransitions(status, { cancellationPending = false } = {}) {
  const current = normalizeOrderStatus(status)
  const allowed = [...(ORDER_TRANSITIONS[current] || [])]
  if (cancellationPending) return allowed.filter(next => next !== 'shipping')
  return allowed
}

export function canRequestCancellation(order) {
  const status = normalizeOrderStatus(order?.status)
  return CANCELLABLE_ORDER_STATUSES.includes(status) && !(order?.cancellationRequests || []).some(request => request.status === 'pending')
}

export function createOrderStatusEvent({ from, to, actor, note = '', at = new Date().toISOString() }) {
  if (!Object.hasOwn(ORDER_STATUS_LABELS, to)) throw new Error('Trạng thái đơn hàng không hợp lệ.')
  if (from && !allowedOrderTransitions(from).includes(to) && !(to === 'cancelled' && CANCELLABLE_ORDER_STATUSES.includes(normalizeOrderStatus(from)))) {
    throw new Error('Không thể chuyển đơn hàng sang trạng thái này.')
  }
  return { id: createId('AUDIT'), from: from ? normalizeOrderStatus(from) : null, to, status: to, at, actorId: actor?.id || actor?.email || 'system', actorName: actor?.name || actor?.email || 'Hệ thống', actorRole: actor?.role || 'system', note: String(note).trim() }
}

export function actualOrderTimeline(order) {
  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : []
  const events = history.filter(event => event && (event.at || event.createdAt) && normalizeOrderStatus(event.to || event.status))
  if (!events.length && order?.orderedAt) events.push({ status: 'pending', at: order.orderedAt, note: 'Đơn hàng được tạo' })
  return events.map(event => {
    const status = normalizeOrderStatus(event.to || event.status)
    const label = status === 'pending' ? 'Đặt hàng thành công' : status === 'confirmed' ? 'Đơn hàng được xác nhận' : status === 'processing' ? 'Đang chuẩn bị hàng' : status === 'shipping' ? 'Đơn hàng đang vận chuyển' : status === 'delivered' ? 'Giao hàng thành công' : 'Đơn hàng đã hủy'
    return { ...event, status, label, at: event.at || event.createdAt }
  })
}

