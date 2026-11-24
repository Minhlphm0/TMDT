import { DEMO_POLICY_CONFIG, isReturnWindowOpen } from './store.js'

export const RETURN_STATUSES = Object.freeze({
  pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', receiving: 'Đang nhận hàng',
  inspecting: 'Đang kiểm tra', refunding: 'Đang xử lý hoàn tiền', refunded: 'Đã hoàn tiền',
  exchanging: 'Đang đổi hàng', exchanged: 'Đã đổi hàng',
})
export const RETURN_REASONS = Object.freeze({
  defect: 'Sản phẩm bị lỗi', wrong: 'Giao sai sản phẩm', damaged: 'Hư hỏng khi vận chuyển',
  change: 'Muốn đổi sản phẩm', other: 'Lý do khác',
})
const inactiveStatuses = new Set(['rejected'])
export const RETURN_TRANSITIONS = Object.freeze({
  pending: ['approved', 'rejected'], approved: ['receiving'], receiving: ['inspecting'],
  inspecting: ['refunding', 'exchanging'], refunding: ['refunded'], exchanging: ['exchanged'],
  rejected: [], refunded: [], exchanged: [],
})
export const REFUND_METHODS = Object.freeze({ wallet: 'Ví mô phỏng', bank: 'Tài khoản ngân hàng (mô phỏng)', nextOrder: 'Trừ vào đơn hàng tiếp theo (mô phỏng)' })

export function validateReturnTransition(currentStatus, nextStatus) {
  return (RETURN_TRANSITIONS[currentStatus] || []).includes(nextStatus)
    ? { valid: true }
    : { valid: false, error: `Không thể chuyển từ “${RETURN_STATUSES[currentStatus] || currentStatus}” sang “${RETURN_STATUSES[nextStatus] || nextStatus}”.` }
}

export function calculateRefundCap(request, order) {
  return (request?.products || []).reduce((total, requested) => {
    const line = (order?.items || []).find(item => String(item.id) === String(requested.productId))
    if (!line) return total
    return total + (Number(line.price) || 0) * (Number(requested.quantity) || 0)
  }, 0)
}

export function validateRefund(request, order, amount, method) {
  const cap = calculateRefundCap(request, order)
  const value = Number(amount)
  if (!Number.isFinite(value) || value < 0) return { valid: false, cap, error: 'Số tiền hoàn phải là số không âm hợp lệ.' }
  if (value > cap) return { valid: false, cap, error: `Số tiền không được vượt quá ${cap}.` }
  if (!Object.hasOwn(REFUND_METHODS, method)) return { valid: false, cap, error: 'Vui lòng chọn phương thức hoàn tiền mô phỏng.' }
  return { valid: true, cap, amount: value }
}

export function validateApprovalQuantity(request, requests, order) {
  const totals = new Map()
  for (const entry of requests) {
    if (entry.orderId !== request.orderId || entry.status === 'rejected') continue
    for (const product of entry.products || []) {
      const key = String(product.productId)
      totals.set(key, (totals.get(key) || 0) + (Number(product.quantity) || 0))
    }
  }
  for (const [productId, total] of totals) {
    const purchased = (order?.items || []).filter(item => String(item.id) === productId).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    if (!purchased || total > purchased) return { valid: false, productId, total, purchased, error: 'Không thể duyệt: tổng số lượng yêu cầu vượt số lượng đã mua.' }
  }
  return { valid: true }
}

export function returnDeadline(order, requests = [], now = new Date(), days = DEMO_POLICY_CONFIG.returnWindowDays) {
  if (!order?.deliveredAt) return { eligible: false, remainingDays: 0, reason: 'Đơn hàng chưa có ngày giao thực tế.' }
  if (!isReturnWindowOpen(order, now, days)) {
    const delivered = ['delivered', 'đã giao'].includes(String(order.status || '').toLowerCase())
    return { eligible: false, remainingDays: 0, reason: delivered ? 'Đã hết thời hạn đổi trả demo.' : 'Đơn hàng chưa được xác nhận đã giao.' }
  }
  const remainingDays = Math.max(0, Math.ceil((new Date(order.deliveredAt).getTime() + days * 86400000 - new Date(now).getTime()) / 86400000))
  return { eligible: true, remainingDays, reason: '' }
}

export function remainingReturnQuantity(order, item, requests = []) {
  const purchased = Number(item?.qty) || 0
  const alreadyRequested = requests.filter(request => request.orderId === order?.id && !inactiveStatuses.has(request.status))
    .flatMap(request => request.products || [])
    .filter(product => String(product.productId) === String(item?.id))
    .reduce((sum, product) => sum + (Number(product.quantity) || 0), 0)
  return Math.max(0, purchased - alreadyRequested)
}

export function canRequestReturn(order, item, requests, now = new Date()) {
  const deadline = returnDeadline(order, requests, now)
  if (!deadline.eligible) return { ...deadline, remainingQuantity: 0 }
  const remainingQuantity = remainingReturnQuantity(order, item, requests)
  const duplicate = requests.some(request => request.orderId === order?.id && !inactiveStatuses.has(request.status) &&
    (request.products || []).some(product => String(product.productId) === String(item?.id)))
  if (duplicate) return { ...deadline, remainingQuantity, eligible: false, reason: 'Sản phẩm đã có yêu cầu đang xử lý; không thể tạo yêu cầu trùng.' }
  return { ...deadline, remainingQuantity, eligible: remainingQuantity > 0, reason: remainingQuantity ? '' : 'Sản phẩm đã có yêu cầu đổi trả đang xử lý hoặc đã hoàn tất.' }
}
