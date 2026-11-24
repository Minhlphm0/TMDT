import test from 'node:test'
import assert from 'node:assert/strict'
import { actualOrderTimeline, allowedOrderTransitions, canRequestCancellation, createOrderStatusEvent, normalizeOrderStatus } from './orders.js'

test('normalizes legacy shipped status and permits only the next lifecycle step',()=>{
  assert.equal(normalizeOrderStatus('shipped'),'shipping')
  assert.deepEqual(allowedOrderTransitions('pending'),['confirmed'])
  assert.deepEqual(allowedOrderTransitions('processing'),['shipping'])
  assert.deepEqual(allowedOrderTransitions('shipped'),['delivered'])
  assert.deepEqual(allowedOrderTransitions('delivered'),[])
  assert.deepEqual(allowedOrderTransitions('cancelled'),[])
  assert.deepEqual(allowedOrderTransitions('processing',{cancellationPending:true}),[])
  assert.throws(()=>createOrderStatusEvent({from:'delivered',to:'shipping'}),/Không thể chuyển/)
})

test('customer cancellation eligibility excludes terminal and shipping states and duplicate pending requests',()=>{
  assert.equal(canRequestCancellation({status:'processing'}),true)
  assert.equal(canRequestCancellation({status:'shipped'}),false)
  assert.equal(canRequestCancellation({status:'delivered'}),false)
  assert.equal(canRequestCancellation({status:'pending',cancellationRequests:[{status:'pending'}]}),false)
})

test('timeline includes only real events with real timestamps',()=>{
  const timeline=actualOrderTimeline({status:'processing',orderedAt:'2026-01-01T00:00:00Z',statusHistory:[{status:'pending',at:'2026-01-01T00:00:00Z'},{status:'confirmed'},{status:'processing',at:'2026-01-02T00:00:00Z'}]})
  assert.deepEqual(timeline.map(event=>event.label),['Đặt hàng thành công','Đang chuẩn bị hàng'])
  assert.equal(actualOrderTimeline({status:'pending'}).length,0)
})
