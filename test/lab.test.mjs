import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLab} from '../src/lab.mjs';
const inbound=l=>{l.execute('receive');l.execute('putaway');};
const outbound=l=>{l.execute('allocate');l.execute('pick');l.execute('dispatch');};
test('FAT-01 / UAT-01: receive through dispatch conserves stock and delivers once',()=>{
 const l=createLab();inbound(l);l.execute('allocate');assert.deepEqual(l.state.order.allocations.map(a=>a.qty),[12,12]);assert.equal(l.state.stock.reduce((n,s)=>n+s.reserved,0),24);
 l.execute('pick');assert.equal(l.state.stock.reduce((n,s)=>n+s.qty,0),36);assert.equal(l.state.stock.reduce((n,s)=>n+s.reserved,0),0);l.execute('dispatch');l.execute('deliver',{id:'MSG-0001'});assert.equal(l.state.messages[0].status,'DELIVERED');assert.throws(()=>l.execute('deliver',{id:'MSG-0001'}),/duplicate/);
});
test('SIT-02: carrier mapping rejection, correction and retry retain message identity',()=>{
 const l=createLab();inbound(l);l.execute('fault',{enabled:true});outbound(l);l.execute('deliver',{id:'MSG-0001'});assert.equal(l.state.messages[0].response.status,422);assert.equal(l.state.order.status,'DISPATCHED');l.execute('repair',{id:'MSG-0001'});l.execute('deliver',{id:'MSG-0001'});assert.equal(l.state.messages[0].status,'DELIVERED');assert.equal(l.state.messages[0].attempts,2);assert.equal(l.state.messages.length,1);
});
test('FAT-02: capacity rejection leaves receipt and inventory unchanged',()=>{
 const l=createLab();l.execute('rules',{...l.state.rules,maxPerBin:20});l.execute('receive');assert.throws(()=>l.execute('putaway'),/CAPACITY/);assert.equal(l.state.stock.length,1);assert.equal(l.state.receipt.status,'RECEIVED');
});
test('FAT-03: insufficient stock and invalid workflow transitions cannot mutate stock',()=>{
 const l=createLab();assert.throws(()=>l.execute('allocate'),/INSUFFICIENT/);assert.throws(()=>l.execute('pick'),/Expected/);assert.throws(()=>l.execute('dispatch'),/Expected/);assert.equal(l.state.stock[0].reserved,0);assert.equal(l.state.order.status,'NEW');
});
test('FAT-04: configurable LIFO and zone selection',()=>{
 const l=createLab();l.execute('rules',{...l.state.rules,allocation:'LIFO'});inbound(l);l.execute('allocate');assert.deepEqual(l.state.order.allocations,[{lot:'LOT-002',bin:'A-02',qty:24}]);
 const chilled=createLab();chilled.execute('rules',{...chilled.state.rules,zone:'CHILLED'});inbound(chilled);chilled.execute('allocate');assert.equal(chilled.state.order.allocations[0].bin,'C-01');
});
test('FAT-05: invalid configuration rejected; restart snapshot retains state',()=>{
 const l=createLab();assert.throws(()=>l.execute('rules',{...l.state.rules,maxPerBin:-1}),/Invalid/);inbound(l);const restored=createLab(JSON.parse(JSON.stringify(l.state)));assert.equal(restored.state.receipt.status,'PUTAWAY');
});
test('FAT-06: repeat receipt, putaway and pick cannot duplicate movements',()=>{
 const l=createLab();inbound(l);assert.throws(()=>l.execute('receive'));assert.throws(()=>l.execute('putaway'));l.execute('allocate');l.execute('pick');assert.throws(()=>l.execute('pick'));assert.equal(l.state.stock.reduce((n,s)=>n+s.qty,0),36);
});
