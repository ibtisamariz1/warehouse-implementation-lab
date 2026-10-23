import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLab,carrierApi} from './src/lab.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dir=process.env.LAB_DATA_DIR||path.join(root,'data'); fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'state.json');
const lab=createLab(fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):undefined);
const save=()=>fs.writeFileSync(file,JSON.stringify(lab.state,null,2));
const server=http.createServer(async(req,res)=>{
 const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/state'&&req.method==='GET') return send(200,lab.state);
  if((url.pathname.startsWith('/api/')||url.pathname==='/carrier/v1/shipments')&&req.method==='POST'){
   if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) return send(403,{error:'Cross-origin request rejected'});
   let body=''; for await(const chunk of req){body+=chunk;if(body.length>16384) return send(413,{error:'Payload too large'});}
   const input=JSON.parse(body||'{}');
   if(url.pathname==='/carrier/v1/shipments'){const result=carrierApi(input);return send(result.status,result);}
   let response;
   if(url.pathname==='/api/deliver'){
    const message=lab.state.messages.find(m=>m.id===input.id);
    if(!message||message.status==='DELIVERED')throw Error('Message missing or already delivered');
    const remote=await fetch(`http://127.0.0.1:${server.address().port}/carrier/v1/shipments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message.payload),signal:AbortSignal.timeout(3000)});
    response=await remote.json();
   }
   const result=lab.execute(url.pathname.slice(5),input,response); save(); return send(200,result);
  }
  const assets={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
  if(req.method!=='GET'||!assets[url.pathname])return send(404,{error:'Not found'});
  const name=assets[url.pathname];res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(fs.readFileSync(path.join(root,'public',name)));
 }catch(e){send(400,{error:e.message});}
});
server.listen(Number(process.env.PORT||4310),'127.0.0.1',()=>console.log(`Warehouse Lab: http://127.0.0.1:${server.address().port}`));
