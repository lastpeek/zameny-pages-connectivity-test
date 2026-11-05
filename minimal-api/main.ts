// Native Deno API. No Next.js, sender, cron, database, or private VAPID key.
export const PAGES_ORIGIN='https://lastpeek.github.io';
export const CUSTOM_ORIGIN='https://nggpk-zameny.ru';
const allowedOrigins=new Set([PAGES_ORIGIN,CUSTOM_ORIGIN]);
export const WORKER='https://zameny-snapshot-api.steparosliy.workers.dev';
export const PUBLIC_KEY='BLGlJ2y1Aiy1-CUYt12v-1tE_-FQDMAosKKzhSj4jlsBHQ7EDFhKOgkzliPgFcI8xLI5rgd5Ztk2xKeav3efOX4';
const sender='https://zameny-311a.vercel.app/api/notifications';
const enc=new TextEncoder(),group=(v:unknown)=>v==='311а'||v==='1621а',secret=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_-]{43}$/.test(v),hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const digest=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v))),x=>x.toString(16).padStart(2,'0')).join('');
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).sort().join('|')===[...keys].sort().join('|');
type Deps={token?:string;transport?:typeof fetch};
export async function handle(req:Request,deps:Deps={}):Promise<Response>{
 const origin=req.headers.get('Origin');
 const headers:Record<string,string>={'Cache-Control':'private, no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
 if(origin&&allowedOrigins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers});
 const url=new URL(req.url);
 if(url.pathname!=='/api/notifications'||url.search)return reply({ok:false,code:'NOT_FOUND'},404);
 if(!origin||!allowedOrigins.has(origin))return reply({ok:false,code:'ORIGIN_DENIED'},403);
 if(req.method==='OPTIONS'){
  const method=req.headers.get('Access-Control-Request-Method'),names=(req.headers.get('Access-Control-Request-Headers')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  if(!['GET','POST'].includes(method||'')||names.some(x=>!['authorization','content-type'].includes(x)))return reply({ok:false},403);
  return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'}});
 }
 if(!['GET','POST'].includes(req.method))return reply({ok:false},405);
 const authorization=req.headers.get('Authorization')||'';
 if(!/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization))return reply({ok:false,code:'DEVICE_REQUIRED'},401);
 const deviceSecret=authorization.slice(7),bridge=deps.token;
 if(!secret(bridge))return reply({ok:false,code:'API_UNAVAILABLE'},503);
 const transport=deps.transport||fetch;
 try{
  const accessHash=await digest(deviceSecret);
  const bridgeCall=async(message:unknown)=>{
   const r=await transport(WORKER+'/internal/notifications',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+bridge},body:JSON.stringify(message),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(6000)});
   if(!r.ok){let code='UPSTREAM_UNAVAILABLE';try{const v=await r.json();if(['BINDING_CONFLICT','EXPLICIT_GROUP_SWITCH_REQUIRED','REGISTRATION_LIMIT','REGISTRATION_DISABLED','INVALID'].includes(v.code))code=v.code}catch{}throw Object.assign(new Error(code),{status:[409,429].includes(r.status)?r.status:503});}
   const v=await r.json();if(v.ok!==true)throw Error('UPSTREAM_UNAVAILABLE');return v;
  };
  const config=async()=>{
   const v=await bridgeCall({kind:'config',accessHash});
   const d=v.device;
   if(d&&(!group(d.group)||!Number.isSafeInteger(d.bindingVersion)||d.bindingVersion<0||!hex(d.bindingId)||typeof d.active!=='boolean'||typeof d.changes!=='boolean'||typeof d.publications!=='boolean'))throw Error('UPSTREAM_UNAVAILABLE');
   if(typeof v.realEnabled!=='boolean'||typeof v.registrationAllowed!=='boolean')throw Error('UPSTREAM_UNAVAILABLE');
   let sendingEnabled=false,sendingStatusKnown=false;
   try{const r=await transport(sender,{method:'GET',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(2500)});const s=await r.json();if(r.ok&&s.ok===true&&s.publicKey===PUBLIC_KEY&&typeof s.sendingEnabled==='boolean'){sendingEnabled=s.sendingEnabled;sendingStatusKnown=true}}catch{}
   return {ok:true,realEnabled:v.realEnabled,registrationAllowed:v.registrationAllowed,publicKey:PUBLIC_KEY,sendingEnabled,sendingStatusKnown,device:d?{active:d.active,group:d.group,bindingId:d.bindingId,bindingVersion:d.bindingVersion,changes:d.changes,publications:d.publications}:null};
  };
  if(req.method==='GET')return reply(await config());
  if(req.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply({ok:false,code:'JSON_REQUIRED'},415);
  let m:any;try{if(!req.body||Number(req.headers.get('Content-Length'))>8192)throw Error();const reader=req.body.getReader(),chunks:Uint8Array[]=[];let length=0;while(true){const x=await reader.read();if(x.done)break;length+=x.value.length;if(length>8192){await reader.cancel();throw Error()}chunks.push(x.value)}const bytes=new Uint8Array(length);let at=0;for(const x of chunks){bytes.set(x,at);at+=x.length}m=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({ok:false,code:'INVALID'},400)}
  if(!m||typeof m!=='object'||Array.isArray(m))return reply({ok:false,code:'INVALID'},400);
  if(m.action==='unsubscribe'&&exact(m,['action'])){await bridgeCall({kind:'unsubscribe',accessHash});return reply({ok:true,result:'unsubscribed'});}
  if(m.action==='switch_group'&&exact(m,['action','group','expectedGroup','expectedVersion'])&&group(m.group)&&group(m.expectedGroup)&&Number.isSafeInteger(m.expectedVersion)&&m.expectedVersion>=0){const v=await bridgeCall({kind:'switch_group',accessHash,group:m.group,expectedGroup:m.expectedGroup,expectedVersion:m.expectedVersion});return reply({ok:true,result:v.result,group:v.group,bindingVersion:v.bindingVersion});}
  if(m.action!=='subscribe'||!exact(m,['action','group','changes','publications','consent','subscription'])||!group(m.group)||m.consent!==true||typeof m.changes!=='boolean'||typeof m.publications!=='boolean'||!(m.changes||m.publications))return reply({ok:false,code:'INVALID'},400);
  const s=m.subscription;
  if(!s||typeof s!=='object'||!exact(s,['endpoint','keys'])||typeof s.endpoint!=='string'||s.endpoint.length>2048||!s.keys||typeof s.keys!=='object'||!exact(s.keys,['p256dh','auth'])||typeof s.keys.p256dh!=='string'||typeof s.keys.auth!=='string'||!(/^[A-Za-z0-9_-]{87}=?$/.test(s.keys.p256dh))||!(/^[A-Za-z0-9_-]{22}={0,2}$/.test(s.keys.auth)))return reply({ok:false,code:'INVALID'},400);
  try{const u=new URL(s.endpoint);if(u.protocol!=='https:'||u.username||u.password||u.hash)throw Error()}catch{return reply({ok:false,code:'INVALID'},400)}
  const hmacKey=await crypto.subtle.importKey('raw',enc.encode(bridge!),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const rateKey=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',hmacKey,enc.encode('pages-subscription-management-v1'))),x=>x.toString(16).padStart(2,'0')).join('');
  const v=await bridgeCall({kind:'register',accessHash,rateKey,group:m.group,subscription:s,changes:m.changes,publications:m.publications,consent:true});return reply({ok:true,result:v.result});
 }catch(e){const code=e instanceof Error&&['BINDING_CONFLICT','EXPLICIT_GROUP_SWITCH_REQUIRED','REGISTRATION_LIMIT','REGISTRATION_DISABLED'].includes(e.message)?e.message:'API_UNAVAILABLE';const status=(e as {status?:number})?.status;return reply({ok:false,code},[409,429].includes(status||0)?status:503);}
}
if(import.meta.main){const token=Deno.env.get('PUSH_BRIDGE_TOKEN');Deno.serve(req=>handle(req,{token}));}
