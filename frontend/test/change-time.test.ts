import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmedChangeTime} from '../src/ui/static-state';
import type {ApiState} from '../src/ui/api-state';
const t='2026-11-05T02:30:27.875Z',check='2026-11-05T12:30:00.000Z';
function state(group:string,changed:string|null,journalGroup:string,eventTime:string|null):ApiState{return {group,dataChangedAt:changed,lastSuccessfulCheck:check,pages:{generatedAt:check,journals:{'2026-11-06':{group:journalGroup,lessonDate:'2026-11-06',dayStatus:null,events:eventTime?[{sequence:1,checkedAt:eventTime,details:[]}]:[]}}}} as unknown as ApiState}
test('shows the actual group change, not check or publication time',()=>{for(const g of ['311а','1621а'])assert.equal(confirmedChangeTime(state(g,t,g,t)),t)});
test('unknown, baseline, unrelated group or unconfirmed snapshot remain unknown',()=>{assert.equal(confirmedChangeTime(null),null);assert.equal(confirmedChangeTime(state('311а',null,'311а',t)),null);assert.equal(confirmedChangeTime(state('311а',check,'311а',t)),null);assert.equal(confirmedChangeTime(state('311а',t,'1621а',t)),null);assert.equal(confirmedChangeTime(state('311а',t,'311а',null)),null)});
