let state;
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function act(action,input={}){try{const r=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const data=await r.json();if(!r.ok)throw Error(data.error);state=data;render();$('#notice').textContent=`Completed: ${action}. Latest event recorded in the journal.`;}catch(e){$('#notice').textContent=e.message;}}
function render(){
 const available=state.stock.reduce((n,s)=>n+s.qty-s.reserved,0);
 $('#metrics').innerHTML=[['Available units',available],['Inbound receipt',state.receipt.status],['Order status',state.order.status],['API exceptions',state.messages.filter(m=>m.status==='FAILED').length]].map(([label,value])=>`<div class="metric"><span>${label}</span><strong>${escape(value)}</strong></div>`).join('');
 const progress=state.order.status==='DISPATCHED'?5:state.order.status==='PICKED'?4:state.order.status==='ALLOCATED'?3:state.receipt.status==='PUTAWAY'?2:state.receipt.status==='RECEIVED'?1:0;
 $('#flow').innerHTML=['Receive','Putaway','Allocate','Pick','Dispatch'].map((s,i)=>`<div class="step ${progress>i?'done':''}">${progress>i?'✓':String(i+1).padStart(2,'0')} &nbsp;${s}</div>`).join('');
 $('#receipt').textContent=`48 expected units · ${state.receipt.status}`;$('#order').textContent=state.order.allocations.length?state.order.allocations.map(a=>`${a.qty} units from ${a.bin}`).join(' / '):'Waiting for allocation';
 $('#stock').innerHTML=state.stock.map(s=>`<tr><td><b>${escape(s.id)}</b> / ${escape(s.sku)}</td><td>${escape(s.bin)}</td><td>${escape(s.zone)}</td><td>${s.qty}</td><td>${s.reserved}</td><td>${s.qty-s.reserved}</td></tr>`).join('');
 for(const [key,value] of Object.entries(state.rules))$('#rules').elements[key].value=value;
 $('#fault').checked=state.fault;
 const enabled={receive:state.receipt.status==='EXPECTED',putaway:state.receipt.status==='RECEIVED',allocate:state.order.status==='NEW',pick:state.order.status==='ALLOCATED',dispatch:state.order.status==='PICKED'};
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!enabled[b.dataset.action]);
 $('#messages').innerHTML=state.messages.length?state.messages.map(m=>`<div class="message"><b>${escape(m.id)} · ${escape(m.status)}</b><p>${m.attempts} delivery attempts</p><pre>${escape(JSON.stringify(m.payload,null,2))}</pre>${m.response?`<pre>${escape(JSON.stringify(m.response,null,2))}</pre>`:''}<div class="actions">${m.status!=='DELIVERED'?`<button data-message="${m.id}" data-op="deliver">${m.attempts?'Retry delivery':'Send to carrier'}</button>`:''}${m.status==='FAILED'?`<button data-message="${m.id}" data-op="repair">Repair mapping</button>`:''}</div></div>`).join(''):'<p class="muted">No outbound messages yet. Dispatch the order to create one.</p>';
 $('#events').innerHTML=state.events.length?state.events.map(e=>`<div class="event"><time>${new Date(e.at).toLocaleTimeString()}</time><b>${escape(e.action)}</b><span>${escape(e.detail)}</span></div>`).join(''):'<p class="muted">Your warehouse actions will appear here.</p>';
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.action)act(b.dataset.action);if(b?.dataset.message)act(b.dataset.op,{id:b.dataset.message});});
$('#rules').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));values.maxPerBin=Number(values.maxPerBin);act('rules',values);};$('#fault').onchange=e=>act('fault',{enabled:e.target.checked});$('#reset').onclick=()=>{if(confirm('Restore sample data and clear the journal?'))act('reset');};
fetch('/api/state').then(r=>r.json()).then(data=>{state=data;render();}).catch(e=>$('#notice').textContent='Unable to load warehouse: '+e.message);


