import test from 'node:test'
import assert from 'node:assert/strict'
import { consumeInventory, getAvailableStock, releaseInventory, reserveInventory } from './inventory.js'

test('inventory is unavailable until explicitly configured',()=>{
  assert.deepEqual(getAvailableStock([],4),{configured:false,onHand:0,reserved:0,available:0})
})

test('reserves only available quantity and blocks missing, exhausted, and oversold stock',()=>{
  const original=[{productId:4,productName:'GPU',onHand:3,reserved:1}]
  assert.equal(reserveInventory(original,[{id:4,qty:2}]).inventory[0].reserved,3)
  assert.throws(()=>reserveInventory(original,[{id:4,qty:3}]),/chỉ còn 2/)
  assert.throws(()=>reserveInventory([], [{id:4,qty:1}]),/chưa được thiết lập/)
  assert.deepEqual(original,[{productId:4,productName:'GPU',onHand:3,reserved:1}])
})

test('release returns held quantity and consume deducts on hand once',()=>{
  const held=[{productId:4,onHand:5,reserved:2}]
  assert.deepEqual(releaseInventory(held,[{id:4,qty:2}]),[{productId:4,onHand:5,reserved:0}])
  assert.deepEqual(consumeInventory(held,[{id:4,qty:2}]),[{productId:4,onHand:3,reserved:0}])
  assert.throws(()=>consumeInventory([{productId:4,onHand:5,reserved:0}],[{id:4,qty:1}]),/đang giữ/)
})
