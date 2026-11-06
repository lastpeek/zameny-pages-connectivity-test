import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bellRange, pairCountdown, PRE_START_MINUTES, vladivostokDate, weekdayForDate} from '../src/ui/pair-timer';

/** Vladivostok = UTC+10. 2026-11-09 is Monday, 2026-11-10 Tuesday, 2026-11-15 Sunday. */
const at = (date: string, time: string) => Date.parse(`${date}T${time}+10:00`);

test('Monday uses its own bell table including pair 0', () => {
 assert.equal(weekdayForDate('2026-11-09'),1);
 assert.deepEqual(bellRange('2026-11-09',0),{start:'08:45',end:'09:15'});
 assert.deepEqual(pairCountdown(at('2026-11-09','08:25'),'2026-11-09',0),{phase:'before',minutes:20,text:'до начала 20 мин'});
 assert.deepEqual(pairCountdown(at('2026-11-09','09:00'),'2026-11-09',0),{phase:'during',minutes:15,text:'до конца 15 мин'});
});

test('Tuesday–Saturday use the regular table and have no pair 0', () => {
 assert.equal(weekdayForDate('2026-11-10'),2);
 assert.deepEqual(bellRange('2026-11-10',1),{start:'08:45',end:'10:15'});
 assert.equal(bellRange('2026-11-10',0),null);
 assert.deepEqual(pairCountdown(at('2026-11-10','08:25'),'2026-11-10',1),{phase:'before',minutes:20,text:'до начала 20 мин'});
 assert.deepEqual(pairCountdown(at('2026-11-10','09:00'),'2026-11-10',1),{phase:'during',minutes:75,text:'до конца 75 мин'});
 assert.deepEqual(bellRange('2026-11-14',3),{start:'12:45',end:'14:15'});
});

test('20-minute boundary, rounding, end of pair and gaps', () => {
 assert.equal(PRE_START_MINUTES,20);
 assert.equal(pairCountdown(at('2026-11-09','08:24'),'2026-11-09',0),null);
 assert.equal(pairCountdown(at('2026-11-09','08:44'),'2026-11-09',0)?.minutes,1);
 assert.deepEqual(pairCountdown(at('2026-11-09','08:44:30'),'2026-11-09',0),{phase:'before',minutes:1,text:'до начала 1 мин'});
 assert.equal(pairCountdown(at('2026-11-09','09:15'),'2026-11-09',0),null);
 assert.equal(pairCountdown(at('2026-11-09','09:15'),'2026-11-09',1)?.minutes,10);
 // Between pairs, but more than 20 minutes before the next one.
 assert.equal(pairCountdown(at('2026-11-09','12:40'),'2026-11-09',2),null);
 assert.equal(pairCountdown(at('2026-11-09','12:40'),'2026-11-09',3),null);
 assert.equal(pairCountdown(at('2026-11-09','13:05'),'2026-11-09',3)?.minutes,20);
});

test('bell times are shown for any published date, countdown only for today', () => {
 assert.deepEqual(bellRange('2026-11-10',2),{start:'10:25',end:'11:55'});
 assert.equal(pairCountdown(at('2026-11-09','08:25'),'2026-11-10',1),null);
 assert.equal(bellRange('2026-11-15',1),null);
});

test('time is calculated in Vladivostok, not from the device zone', () => {
 // 2026-11-09T15:30Z is Tuesday 01:30 in Vladivostok: no pair on the Monday card.
 assert.equal(vladivostokDate(Date.parse('2026-11-09T15:30:00Z')),'2026-11-10');
 assert.equal(pairCountdown(Date.parse('2026-11-09T15:30:00Z'),'2026-11-09',4),null);
 // 2026-11-10T22:26Z is Wednesday 08:26 in Vladivostok: pair 1 starts in 19 minutes.
 assert.deepEqual(pairCountdown(Date.parse('2026-11-10T22:26:00Z'),'2026-11-11',1),{phase:'before',minutes:19,text:'до начала 19 мин'});
});
