import {mkdir,writeFile,rm,rename,mkdtemp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {adaptRemote} from '../frontend/src/ui/remote-state';
import {validateJournal,readStaticState} from '../frontend/src/ui/static-state';
const root=fileURLToPath(new URL('../',import.meta.url));
export const WORKER='https://zameny-snapshot-api.steparosliy.workers.dev';
export const GROUPS=['311а','1621а'] as const;
type GetJSON=(url:string)=>Promise<any>;
async function getJSON(url:string){
 const r=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'zameny-pages-public-publisher/1.0','Accept':'application/json'}});
 if(!r.ok)throw Error(`Public Worker HTTP ${r.status}`);
 const bytes=await r.arrayBuffer();if(bytes.byteLength>2000000)throw Error('Public response exceeds safety limit');
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function collect(get:GetJSON=getJSON,now=Date.now()){
 const gathered:any[]=[];
 for(const group of GROUPS){
  const endpoint=WORKER+'/api/schedule?group='+encodeURIComponent(group);
  const raw=await get(endpoint),state=adaptRemote(raw,now,group);
  if(!raw.snapshot||raw.status.checkStatus!=='ok'||!state.lastSuccessfulCheck)throw Error('Source is not a completed successful snapshot; keep previous release');
  const journals:Record<string,unknown>={};
  for(const c of state.coverage){const url=WORKER+'/api/changes?'+new URLSearchParams({group,date:c.date});journals[c.date]=validateJournal(await get(url),group,c.date);}
  const again=await get(endpoint);
  if(JSON.stringify(again)!==JSON.stringify(raw))throw Error('Snapshot changed during collection; keep previous release');
  gathered.push({group,raw,journals});
 }
 const generatedAt=new Date(now).toISOString();
 const files:Record<string,unknown>={};
 for(const g of gathered){
  const value={...g.raw,_pages:{generatedAt,journals:g.journals}};
  readStaticState(value,now,g.group);
  files[g.group+'/schedule.json']=value;
 }
 files['capture.json']={generatedAt,source:WORKER,mode:'actions-public-worker-snapshot',groups:gathered.map(g=>({group:g.group,entries:g.raw.snapshot.entries.length,journalDates:Object.keys(g.journals),lastSuccessfulCheck:g.raw.status.lastSuccessfulCheckAt}))};
 return files;
}
export async function publish(get:GetJSON=getJSON,target=join(root,'frontend/public/stage1-data'),now=Date.now()){
 // Nothing is touched until both groups and all journals are fetched and validated.
 const files=await collect(get,now);await mkdir(resolve(target,'..'),{recursive:true});
 const temp=await mkdtemp(resolve(target,'..')+'/.pages-data-');
 try{for(const [name,value] of Object.entries(files)){const p=join(temp,name);await mkdir(resolve(p,'..'),{recursive:true});await writeFile(p,JSON.stringify(value));}
  await rm(target,{recursive:true,force:true});await rename(temp,target);
 }catch(e){await rm(temp,{recursive:true,force:true});throw e;}
 console.log('Validated public dataset:',GROUPS.join(', '),'— no Deno, parser, secrets or writes to Worker.');
 return files;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))publish().catch(e=>{console.error(e instanceof Error?e.message:'Publication failed');process.exitCode=1});
