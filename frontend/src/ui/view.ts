import type { ApiState, Entry } from "./api-state";
export type { ApiState } from "./api-state";
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}
export type GroupOption = ApiState["groupCatalog"]["groups"][number];
export const GROUP_STORAGE_KEY = "college-pilot.selected-group.v1";
export function searchGroups(
  groups: GroupOption[],
  query: string,
): GroupOption[] {
  const normalized = (s: string) =>
    s.normalize("NFC").replace(/\s+/gu, "").toLocaleLowerCase("ru-RU");
  const q = normalized(query);
  return groups.filter((g) =>
    [g.label, ...g.aliases].some((x) => normalized(x).includes(q)),
  );
}
export function restoredGroup(
  value: string | null,
  groups: GroupOption[],
): string | null {
  if (!value) return null;
  const norm = (s: string) =>
    s.normalize("NFC").replace(/\s+/gu, "").toLocaleLowerCase("ru-RU");
  return (
    groups.find((g) =>
      [g.id, ...g.aliases].some((x) => norm(x) === norm(value)),
    )?.id || null
  );
}
export function nextDate(day: string): string {
  if (!validDate(day)) throw new Error("Full calendar date required");
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
/** Calendar-only weekday: never use the computer/server local timezone. */
export function weekdayIndex(day: string): number | null {
  if (!validDate(day)) return null;
  return new Date(`${day}T00:00:00Z`).getUTCDay() || 7;
}
export const STUDY_WEEKDAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
] as const;
/** Published calendar dates only: nearest today/future, otherwise latest past. */
export function weekdayNavigation(today: string | null, dates: string[]) {
  const known = [...new Set(dates.filter(validDate))].sort();
  return STUDY_WEEKDAYS.map((label, i) => {
    const index = i + 1;
    const matching = known.filter((day) => weekdayIndex(day) === index);
    const date = today && validDate(today)
      ? matching.find((day) => day >= today) || matching.at(-1) || null
      : null;
    return { label, index, date, published: date !== null,
      past: Boolean(date && today && date < today) };
  });
}
/** An explicit date stays fixed even if it is absent from the latest snapshot. */
export function resolveScheduleDate(today: string | null, dates: string[], index: number, exactDate = ""): string {
  return validDate(exactDate) ? exactDate
    : weekdayNavigation(today, dates).find((option) => option.index === index)?.date || "";
}
/** Only a user pressing a weekday tab leaves exact-date mode. Never add a date here. */
export function weekdayUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("date");
  url.searchParams.delete("dates");
  return url.pathname + url.search + url.hash;
}
export function readableDayMonth(day: string): string {
  return validDate(day) ? new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC", day: "numeric", month: "long",
  }).format(new Date(`${day}T00:00:00Z`)) : "Не опубликовано";
}
export function readableDate(day: string, short = false): string {
  if (!validDate(day)) return "Дата требует проверки";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    day: "numeric",
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
  }).format(new Date(`${day}T00:00:00Z`));
}
export function weekday(day: string): string {
  return validDate(day)
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "UTC",
        weekday: "long",
      }).format(new Date(`${day}T00:00:00Z`))
    : "";
}
export function readableInstant(
  value: string | null,
  timeZone: string,
): string {
  if (!value || Number.isNaN(Date.parse(value)))
    return "Успешных проверок пока нет";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
export function entriesForDate(
  entries: Entry[],
  group: string,
  day: string,
): Entry[] {
  return entries
    .filter(
      (e) =>
        e.group === group && e.lessonDate === day && validDate(e.lessonDate),
    )
    .sort(
      (a, b) =>
        (a.pair?.from ?? 99) - (b.pair?.from ?? 99) || a.id.localeCompare(b.id),
    );
}
export function availableDates(state: ApiState, group = state.group): string[] {
  return [
    ...new Set([
      ...state.coverage.filter((c) => state.group === group && c.groupFound).map((c) => c.date),
      ...state.entries
        .filter((e) => e.group === group)
        .map((e) => e.lessonDate),
    ]),
  ]
    .filter(validDate)
    .sort();
}
export function stateBanner(
  state: ApiState,
): { tone: "warning" | "error"; title: string; body: string } | null {
  if (state.status === "source_unavailable")
    return {
      tone: "error",
      title: "Источник сейчас недоступен",
      body: state.entries.length
        ? "Показаны последние сохранённые данные. Они могут быть устаревшими."
        : "Получить данные из источника не удалось. Это не означает, что изменений нет.",
    };
  if (state.status === "format_changed_or_ambiguous")
    return {
      tone: "warning",
      title: "Данные требуют проверки",
      body: state.entries.length
        ? "Формат источника изменился или разбор неоднозначен. Показаны последние сохранённые данные."
        : "Надёжно прочитать источник не удалось. Записи не заменяем догадками.",
    };
  if (state.isStale || state.status === "stale")
    return {
      tone: "warning",
      title: "Показаны последние сохранённые данные",
      body: "Они могут быть устаревшими. Проверьте первоисточник перед занятиями.",
    };
  return null;
}
