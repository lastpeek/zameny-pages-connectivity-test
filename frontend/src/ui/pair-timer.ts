import { BELL_SCHEDULES } from "./bells";

/** Vladivostok has no DST; UTC+10 is used instead of the device clock. */
const VLADIVOSTOK_OFFSET_MS = 10 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
export const PRE_START_MINUTES = 20;

export type BellRange = { start: string; end: string };
export type PairStatus = {
  phase: "before" | "during";
  minutes: number;
  text: string;
};

function minutesOfDay(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 0 = Sunday … 6 = Saturday for a published `YYYY-MM-DD` date. */
export function weekdayForDate(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function vladivostokDate(now: number): string {
  return new Date(now + VLADIVOSTOK_OFFSET_MS).toISOString().slice(0, 10);
}

function vladivostokMinutes(now: number): number {
  return ((now + VLADIVOSTOK_OFFSET_MS) % DAY_MS) / MINUTE_MS;
}

function rowsForWeekday(weekday: number) {
  if (weekday === 1) return BELL_SCHEDULES.find((s) => s.id === "monday")!.rows;
  if (weekday >= 2 && weekday <= 6)
    return BELL_SCHEDULES.find((s) => s.id === "tuesday-saturday")!.rows;
  return null;
}

/** Bell times for a published date and pair; null when the pair has no row. */
export function bellRange(date: string, pair: number): BellRange | null {
  const row = rowsForWeekday(weekdayForDate(date))?.find((r) => r.pair === pair);
  return row ? { start: row.start, end: row.end } : null;
}

/** Countdown label for today's pair only; null on other dates or outside the window. */
export function pairCountdown(
  now: number,
  date: string,
  pair: number,
): PairStatus | null {
  if (date !== vladivostokDate(now)) return null;
  const range = bellRange(date, pair);
  if (!range) return null;
  const current = vladivostokMinutes(now);
  const start = minutesOfDay(range.start);
  const end = minutesOfDay(range.end);
  if (current >= start && current < end) {
    const minutes = Math.ceil(end - current);
    return { phase: "during", minutes, text: `до конца ${minutes} мин` };
  }
  const untilStart = start - current;
  if (untilStart > 0 && untilStart <= PRE_START_MINUTES) {
    const minutes = Math.ceil(untilStart);
    return { phase: "before", minutes, text: `до начала ${minutes} мин` };
  }
  return null;
}
