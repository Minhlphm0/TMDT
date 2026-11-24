import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateRefundCap, RETURN_TRANSITIONS, validateApprovalQuantity, validateRefund, validateReturnTransition } from './returns.js'

test('return transitions follow only the configured path and terminal statuses cannot move', () => {
  assert.equal(validateReturnTransition('pending','approved').valid,true)
  assert.equal(validateReturnTransition('pending','receiving').valid,false)
  assert.equal(validateReturnTransition('approved','inspecting').valid,false)
  assert.equal(validateReturnTransition('inspecting','refunding').valid,true)
  assert.equal(validateReturnTransition('inspecting','exchanging').valid,true)
  assert.deepEqual(RETURN_TRANSITIONS.refunded,[])
  assert.equal(validateReturnTransition('exchanged','pending').valid,false)
})

test('refund is bounded by requested product quantity and requires a mock method', () => {
  const request={products:[{productId:1,quantity:2}]},order={items:[{id:1,qty:4,price:250000}]}
  assert.equal(calculateRefundCap(request,order),500000)
  assert.equal(validateRefund(request,order,400000,'wallet').valid,true)
  assert.equal(validateRefund(request,order,-1,'wallet').valid,false)
  assert.equal(validateRefund(request,order,500001,'wallet').valid,false)
  assert.equal(validateRefund(request,order,100,'cash').valid,false)
})

test('approval enforces purchased quantity across requests; rejection releases quantity while completion retains it', () => {
  const order={id:'O-1',items:[{id:'P-1',qty:2}]}
  const current={id:'R-2',orderId:'O-1',status:'pending',products:[{productId:'P-1',quantity:1}]}
  const other={id:'R-1',orderId:'O-1',status:'refunded',products:[{productId:'P-1',quantity:1}]}
  assert.equal(validateApprovalQuantity(current,[other,current],order).valid,true)
  assert.equal(validateApprovalQuantity(current,[other,{...current,products:[{productId:'P-1',quantity:2}]}],order).valid,false)
  assert.equal(validateApprovalQuantity(current,[{...other,status:'rejected'},current],order).valid,true)
})
