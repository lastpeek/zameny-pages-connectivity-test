/* One production contract: imported by Node sender and classic Service Worker. */
(function(root){
 const VERSION='push-contract-3';
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 function target(kind,value,origin){
  if(typeof value!=='string'||value.length>1024)return null;
  let u;try{u=new URL(value,origin)}catch{return null}
  if(u.origin!==origin||u.pathname!=='/'||u.hash||u.username||u.password)return null;
  if(kind==='test')return u.search===''?u:null;
  if(kind!=='schedule')return null;
  const p=u.searchParams;
  if([...p.keys()].some(k=>!['date','dates','group'].includes(k))||p.getAll('date').length!==1||p.getAll('dates').length>1||!validDate(p.get('date')))return null;
  if(p.getAll('group').length>1||(p.has('group')&&!['311а','1621а'].includes(p.get('group'))))return null;
  const dates=p.has('dates')?p.get('dates').split(','):[p.get('date')];
  if(dates.length>14||!dates.every(validDate)||new Set(dates).size!==dates.length||!dates.includes(p.get('date')))return null;
  return u;
 }
 function validateNotice(v,origin){
  if(!v||v.version!==2||!['test','schedule'].includes(v.kind)||typeof v.id!=='string'||!(v.kind==='test'?/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/:/^[a-f0-9]{32}$/).test(v.id)||typeof v.body!=='string'||!v.body.length||v.body.length>300||typeof v.title!=='string'||!v.title.length||v.title.length>80)return null;
  const u=target(v.kind,v.url,origin);if(!u)return null;
  if(v.kind==='schedule'){
   if((v.group??'311а')!==(u.searchParams.get('group')??'311а')||!['311а','1621а'].includes(v.group??'311а')||(v.bindingVersion!==undefined&&(!Number.isSafeInteger(v.bindingVersion)||v.bindingVersion<0)))return null;
   if(v.bindingId!==undefined&&(typeof v.bindingId!=='string'||!/^[a-f0-9]{64}$/.test(v.bindingId)))return null;
   const dates=u.searchParams.get('dates')?.split(',')||[u.searchParams.get('date')];
   if(!Array.isArray(v.dates)||v.dates.length!==dates.length||!v.dates.every((d,i)=>d===dates[i]))return null;
  }
  return {notice:v,url:u.href};
 }
 const api={VERSION,validDate,target,validateNotice};root.ZamenyPushContract=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
