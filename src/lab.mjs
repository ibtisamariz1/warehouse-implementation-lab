export function initial(){return {version:1,rules:{zone:'AMBIENT',allocation:'FIFO',maxPerBin:100,carrierCode:'DEMO-ROAD'},receipt:{id:'ASN-1042',sku:'SKU-TEA',qty:48,status:'EXPECTED'},stock:[{id:'LOT-001',sku:'SKU-TEA',qty:12,reserved:0,bin:'A-01',zone:'AMBIENT',received:'2026-10-01'}],order:{id:'SO-2081',sku:'SKU-TEA',qty:24,status:'NEW',allocations:[]},messages:[],events:[],fault:false};}
export function createLab(saved){let state=saved||initial();
 const event=(action,detail)=>state.events.unshift({id:state.events.length+1,at:new Date().toISOString(),action,detail});
 const requireStatus=(object,status)=>{if(object.status!==status)throw Error(`Expected ${status}; current status is ${object.status}`);};
 const execute=(action,input={},transportResponse)=>{
  if(action==='reset'){state=initial();event('RESET','Sample warehouse restored');return state;}
  if(action==='rules'){
   if(!['AMBIENT','CHILLED'].includes(input.zone)||!['FIFO','LIFO'].includes(input.allocation)||!Number.isInteger(input.maxPerBin)||input.maxPerBin<1||input.maxPerBin>1000||!['DEMO-ROAD','DEMO-AIR'].includes(input.carrierCode))throw Error('Invalid rules: choose a zone, strategy, capacity 1–1000 and demo carrier');
   state.rules={zone:input.zone,allocation:input.allocation,maxPerBin:input.maxPerBin,carrierCode:input.carrierCode};event('CONFIG_CHANGED',JSON.stringify(state.rules));
  }else if(action==='receive'){requireStatus(state.receipt,'EXPECTED');state.receipt.status='RECEIVED';event('RECEIVED','48 units counted at receiving dock');
  }else if(action==='putaway'){
   requireStatus(state.receipt,'RECEIVED');
   const bin=state.rules.zone==='AMBIENT'?'A-02':'C-01';
   if(state.receipt.qty>state.rules.maxPerBin)throw Error('CAPACITY_EXCEEDED: receipt exceeds configured bin capacity');
   state.stock.push({id:'LOT-002',sku:state.receipt.sku,qty:state.receipt.qty,reserved:0,bin,zone:state.rules.zone,received:new Date().toISOString()});state.receipt.status='PUTAWAY';event('PUTAWAY',`48 units → ${bin}`);
  }else if(action==='allocate'){
   requireStatus(state.order,'NEW');const lots=state.stock.filter(s=>s.sku===state.order.sku&&s.zone===state.rules.zone).sort((a,b)=>a.received.localeCompare(b.received)*(state.rules.allocation==='FIFO'?1:-1));
   if(lots.reduce((n,s)=>n+s.qty-s.reserved,0)<state.order.qty)throw Error('INSUFFICIENT_STOCK: receive and put away stock in the configured zone');
   let remaining=state.order.qty; for(const s of lots){const qty=Math.min(remaining,s.qty-s.reserved);if(qty){s.reserved+=qty;state.order.allocations.push({lot:s.id,bin:s.bin,qty});remaining-=qty;}}
   state.order.status='ALLOCATED';event('ALLOCATED',`${state.rules.allocation}: ${JSON.stringify(state.order.allocations)}`);
  }else if(action==='pick'){
   requireStatus(state.order,'ALLOCATED');for(const a of state.order.allocations){const s=state.stock.find(s=>s.id===a.lot);s.qty-=a.qty;s.reserved-=a.qty;}state.order.status='PICKED';event('PICKED','24 reserved units confirmed at dispatch staging');
  }else if(action==='dispatch'){
   requireStatus(state.order,'PICKED');state.order.status='DISPATCHED';const message={id:'MSG-0001',status:'PENDING',attempts:0,payload:{shipmentId:state.order.id,itemCode:state.order.sku,quantity:state.order.qty,carrierCode:state.fault?'INVALID':state.rules.carrierCode},response:null};state.messages.push(message);event('DISPATCHED','Shipment confirmed; outbound message queued');
  }else if(action==='fault'){state.fault=Boolean(input.enabled);event('FAULT_SWITCH',state.fault?'Invalid carrier mapping injected for next dispatch':'Fault injection disabled');
  }else if(action==='deliver'){
   const m=state.messages.find(m=>m.id===input.id);if(!m)throw Error('Message not found');if(m.status==='DELIVERED')throw Error('Already delivered; duplicate prevented');
   // Local carrier API contract simulator: deterministic, no external credentials.
   m.attempts++;m.response=transportResponse||carrierApi(m.payload);m.status=m.response.status===202?'DELIVERED':'FAILED';event('API_RESPONSE',`${m.id}: ${m.response.status} ${m.response.code}`);
  }else if(action==='repair'){
   const m=state.messages.find(m=>m.id===input.id);if(!m||m.status!=='FAILED')throw Error('Select a failed message');m.payload.carrierCode=state.rules.carrierCode;m.status='PENDING';event('MAPPING_REPAIRED',`${m.id}: carrierCode → ${state.rules.carrierCode}; ready for retry`);
  }else throw Error('Unknown action');return state;
 };return {get state(){return state;},execute};
}
export function carrierApi(payload){return ['DEMO-ROAD','DEMO-AIR'].includes(payload.carrierCode)?{status:202,code:'ACCEPTED',reference:`CARRIER-${payload.shipmentId}`}:{status:422,code:'UNKNOWN_CARRIER',field:'carrierCode',detail:'Carrier mapping must use DEMO-ROAD or DEMO-AIR'};}
