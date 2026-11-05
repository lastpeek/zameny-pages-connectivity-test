import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {earlyScheduleBootstrap} from '../src/ui/early-schedule';

async function bootstrap(search:string, saved:string|null, fail=false) {
 const requests:{url:string,opts:any}[]=[];
 const window:any={};
 const context={window,location:{search},localStorage:{getItem:()=>saved},URLSearchParams,AbortController,setTimeout,clearTimeout,encodeURIComponent,
  fetch:async(url:string,opts:any)=>{requests.push({url,opts});if(fail)throw Error('offline');return {ok:true,json:async()=>({sample:true})}}};
 runInNewContext(earlyScheduleBootstrap,context);
 return {group:window.__zamenyEarlySchedule.group, value:await window.__zamenyEarlySchedule.promise, requests};
}
test('early public fetch uses stored group and a single no-store request',async()=>{
 const r=await bootstrap('', '1621а');assert.equal(r.group,'1621а');assert.equal(r.requests.length,1);assert.match(r.requests[0].url,/\/stage1-data\/1621%D0%B0\/schedule\.json$/);assert.equal(r.requests[0].opts.cache,'no-store');assert.deepEqual(r.value,{sample:true});
});
test('valid query alias overrides stored group; unknown query does not',async()=>{
 assert.equal((await bootstrap('?group=311','1621а')).group,'311а');assert.equal((await bootstrap('?group=other','1621а')).group,'1621а');assert.equal((await bootstrap('','invalid')).group,'311а');
});
test('early network errors are contained for the normal loader to retry',async()=>{
 const r=await bootstrap('','311а',true);assert.equal(r.value,null);assert.equal(r.requests.length,1);
});
