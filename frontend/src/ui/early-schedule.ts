import { supportedGroups, pilot } from '../config';
import { GROUP_STORAGE_KEY } from './view';
import { BASE_PATH } from './static-path';

// Fetch only the same allowlisted public snapshot the hydrated app would request.
// No subscription state, private data, or notification API is involved.
export const earlyScheduleBootstrap = `(()=>{try{
 const groups=${JSON.stringify(supportedGroups)}, key=${JSON.stringify(GROUP_STORAGE_KEY)}, base=${JSON.stringify(BASE_PATH)};
 const norm=s=>s.normalize('NFC').replace(/\\s+/gu,'').toLocaleLowerCase('ru-RU');
 const resolve=v=>v&&groups.find(g=>[g.id,...g.aliases].some(x=>norm(x)===norm(v)))?.id;
 let saved=null;try{saved=localStorage.getItem(key)}catch{}
 const group=resolve(new URLSearchParams(location.search).get('group'))||resolve(saved)||${JSON.stringify(pilot.group)};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const promise=fetch(base+'/stage1-data/'+encodeURIComponent(group)+'/schedule.json',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).catch(()=>null).finally(()=>clearTimeout(timer));
 window.__zamenyEarlySchedule={group,promise};
}catch{}})();`;

declare global {
  interface Window {
    __zamenyEarlySchedule?: {group: string; promise: Promise<unknown | null>};
  }
}
