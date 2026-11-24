export function getAvailableStock(inventory, productId) {
  const record = inventory.find(item => String(item.productId) === String(productId))
  if (!record || !Number.isInteger(record.onHand) || record.onHand < 0) return { configured: false, onHand: 0, reserved: 0, available: 0 }
  const reserved = Number.isInteger(record.reserved) && record.reserved >= 0 ? record.reserved : 0
  return { configured: true, onHand: record.onHand, reserved, available: Math.max(0, record.onHand - reserved) }
}

export function aggregateOrderItems(items) {
  const totals = new Map()
  for (const item of items || []) {
    const id = item.productId ?? item.id
    const qty = Number(item.qty ?? item.quantity)
    if (id === undefined || !Number.isInteger(qty) || qty <= 0) throw new Error('Số lượng sản phẩm trong đơn hàng không hợp lệ.')
    totals.set(String(id), (totals.get(String(id)) || 0) + qty)
  }
  return [...totals].map(([productId, qty]) => ({ productId, qty }))
}

export function reserveInventory(inventory, items) {
  const quantities = aggregateOrderItems(items)
  const next = inventory.map(item => ({ ...item }))
  for (const { productId, qty } of quantities) {
    const record = next.find(item => String(item.productId) === productId)
    if (!record) throw new Error(`Sản phẩm ${productId} chưa được thiết lập tồn kho.`)
    const stock = getAvailableStock(next, productId)
    if (qty > stock.available) throw new Error(stock.available ? `Sản phẩm ${record.productName || productId} chỉ còn ${stock.available} sản phẩm có thể đặt.` : `Sản phẩm ${record.productName || productId} hiện đã hết hàng.`)
    record.reserved = stock.reserved + qty
  }
  return { inventory: next, quantities }
}

export function releaseInventory(inventory, items) {
  const next = inventory.map(item => ({ ...item }))
  for (const { productId, qty } of aggregateOrderItems(items)) {
    const record = next.find(item => String(item.productId) === productId)
    if (!record) continue
    record.reserved = Math.max(0, (Number(record.reserved) || 0) - qty)
  }
  return next
}

export function consumeInventory(inventory, items) {
  const next = inventory.map(item => ({ ...item }))
  for (const { productId, qty } of aggregateOrderItems(items)) {
    const record = next.find(item => String(item.productId) === productId)
    if (!record || (Number(record.reserved) || 0) < qty || (Number(record.onHand) || 0) < qty) throw new Error(`Không thể hoàn tất trừ kho cho sản phẩm ${productId}; vui lòng kiểm tra số lượng đang giữ.`)
    record.reserved -= qty
    record.onHand -= qty
  }
  return next
}

