import type {ApiState} from './api-state';
import {adaptRemote} from './remote-state';
export type RecordValue={pair:{from:number;to:number};subject:string|null;teacher:string|null;room:string|null;publishedTime:{start:string;end:string}|null};
export type Detail={kind:'changed'|'added'|'removed';fields?:string[];before:RecordValue|null;after:RecordValue|null};
export type Journal={group:string;lessonDate:string;dayStatus:{checkedAt:string;heldReason:string|null}|null;events:{sequence:number;checkedAt:string;kind?:string;details:Detail[]}[]};
export type Publication={generatedAt:string;journals:Record<string,Journal>};
const instant=(x:unknown):x is string=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
function record(x:any):boolean{return x===null||!!(x&&x.pair&&Number.isInteger(x.pair.from)&&Number.isInteger(x.pair.to)&&x.pair.from>=0&&x.pair.to<=7&&x.pair.from<=x.pair.to&&['subject','teacher','room'].every(k=>x[k]===null||typeof x[k]==='string')&&(x.publishedTime===null||x.publishedTime&&typeof x.publishedTime.start==='string'&&typeof x.publishedTime.end==='string'));}
export function validateJournal(value:unknown,group:string,date:string):Journal{
 const v=value as any;
 if(!v||v.group!==group||v.lessonDate!==date||!Array.isArray(v.events)||!(v.dayStatus===null||v.dayStatus&&instant(v.dayStatus.checkedAt)&&(v.dayStatus.heldReason===null||typeof v.dayStatus.heldReason==='string')))throw Error('JOURNAL_FORMAT');
 const seen=new Set<number>();
 for(const e of v.events){
  if(!Number.isSafeInteger(e.sequence)||seen.has(e.sequence)||!instant(e.checkedAt)||!Array.isArray(e.details)||(e.group!==undefined&&e.group!==group)||(e.lessonDate!==undefined&&e.lessonDate!==date))throw Error('JOURNAL_EVENT');
  seen.add(e.sequence);
  for(const d of e.details)if(!['changed','added','removed'].includes(d.kind)||!record(d.before)||!record(d.after)||(d.fields!==undefined&&(!Array.isArray(d.fields)||!d.fields.every((f:unknown)=>typeof f==='string'))))throw Error('JOURNAL_DETAIL');
 }
 return v;
}
export function readStaticState(value:unknown,now=Date.now(),group:string):ApiState{
 const raw=value as any,state=adaptRemote(raw,now,group),p=raw?._pages;
 if(!p||!instant(p.generatedAt)||!p.journals||typeof p.journals!=='object')throw Error('PUBLICATION_FORMAT');
 const journals:Record<string,Journal>={};
 for(const c of state.coverage)journals[c.date]=validateJournal(p.journals[c.date],group,c.date);
 return {...state,pages:{generatedAt:p.generatedAt,journals}};
}
export function dataAge(lastSuccess:string|null,now:number):string{
 if(!lastSuccess)return 'успешной проверки пока нет';
 const minutes=Math.max(0,Math.floor((now-Date.parse(lastSuccess))/60000));
 if(minutes<1)return 'менее минуты';
 if(minutes<60)return `${minutes} мин.`;
 const hours=Math.floor(minutes/60);return hours<24?`${hours} ч. ${minutes%60} мин.`:`${Math.floor(hours/24)} дн. ${hours%24} ч.`;
}
