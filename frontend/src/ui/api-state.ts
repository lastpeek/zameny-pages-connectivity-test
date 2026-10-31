import type {Publication} from './static-state';
export interface Entry {id:string;group:string;lessonDate:string;pair:{from:number;to:number}|null;changeType:'unknown'|'replacement'|'cancellation';subject:string|null;room:string|null;teacher?:string|null;publishedTime?:{start:string;end:string}|null;}
export interface Coverage {date:string;groupFound:boolean;pairSlots:number;blankSlotsUnknown:number;}
export interface ApiState {
 pages?:Publication;
 status:'ok_data'|'ok_empty'|'stale'|'not_loaded'|'source_unavailable'|'format_changed_or_ambiguous';group:string;isStale:boolean;
 lastAttempt:string|null;lastSuccessfulCheck:string|null;dataChangedAt:string|null;nextEligibleCheck:null;checkInProgress:boolean;timeZone:string;timeZoneStatus:string;today:string;officialPage:string;sourceUrl:null;classification:'unconfirmed';entries:Entry[];coverage:Coverage[];
 groupCatalog:{complete:false;scope:string;note:string;groups:{id:string;label:string;aliases:string[]}[]};
}
