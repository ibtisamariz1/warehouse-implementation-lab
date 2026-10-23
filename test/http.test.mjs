import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('SIT-01/02: HTTP workflow, carrier rejection, repair, retry and static assets',async()=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0',LAB_DATA_DIR:mkdtempSync(join(tmpdir(),'warehouse-lab-test-'))},stdio:['ignore','pipe','pipe']});
 try{
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),5000);child.stdout.on('data',d=>{const m=String(d).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
  const post=async(action,body={})=>{const r=await fetch(base+'/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
  for(const url of ['/','/app.js','/style.css']){const r=await fetch(base+url);assert.equal(r.status,200);assert.ok((await r.text()).length>100);}
  for(const a of ['receive','putaway','allocate','pick','dispatch'])await post(a);
  let s=await post('deliver',{id:'MSG-0001'});assert.equal(s.messages[0].response.status,202);
  await post('reset');for(const a of ['receive','putaway','allocate','pick'])await post(a);await post('fault',{enabled:true});await post('dispatch');s=await post('deliver',{id:'MSG-0001'});assert.equal(s.messages[0].response.status,422);assert.equal(s.messages[0].response.field,'carrierCode');await post('repair',{id:'MSG-0001'});s=await post('deliver',{id:'MSG-0001'});assert.equal(s.messages[0].status,'DELIVERED');assert.equal(s.messages[0].attempts,2);assert.equal(s.stock.reduce((n,l)=>n+l.qty,0),36);
  const cross=await fetch(base+'/api/reset',{method:'POST',headers:{Origin:'https://example.com'}});assert.equal(cross.status,403);
 }finally{child.kill();}
});
