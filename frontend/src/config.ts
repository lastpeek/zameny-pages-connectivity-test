export const pilot = Object.freeze({
  group: "311а",
  timeZone: "Asia/Vladivostok",
  timeZoneEvidence: "Пользователь подтвердил часовой пояс Владивостока.",
  acceptedLabels: ["311а", "311"] as readonly string[],
  aliasEvidence: "Пользователь подтвердил: 311 и 311а — одна группа.",
  officialPage: "https://nggpc.ru/obrazovanie/uchebnaya-rabota/raspisanie",
  linkLabel: "Замены и изменения в расписании",
  parserVersion: "311a-v2",
});
export function normalizeLabel(value: string | number): string {
  return String(value)
    .normalize("NFC")
    .replace(/\s+/gu, "")
    .toLocaleLowerCase("ru-RU");
}
export function isPilotGroup(value: string | number): boolean {
  return pilot.acceptedLabels.some(
    (label) => normalizeLabel(label) === normalizeLabel(value),
  );
}
export interface Config {
  dbPath: string;
  timeZone: string | null;
  intervalMs: number;
  staleMs: number;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
}
function integer(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(env[name] || fallback);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error(`Invalid ${name}: expected ${min}..${max}`);
  return n;
}
export function readConfig(
  env: Record<string, string | undefined> = process.env,
): Config {
  const zone = env.COLLEGE_TIME_ZONE?.trim() || pilot.timeZone;
  if (zone) new Intl.DateTimeFormat("en", { timeZone: zone }).format();
  const interval = integer(env, "CHECK_INTERVAL_SECONDS", 900, 300, 86400);
  const stale = integer(env, "STALE_AFTER_SECONDS", 3600, interval, 604800);
  return {
    dbPath: env.DATABASE_PATH || "./var/pilot.sqlite",
    timeZone: zone,
    intervalMs: interval * 1000,
    staleMs: stale * 1000,
    timeoutMs: integer(env, "REQUEST_TIMEOUT_SECONDS", 20, 1, 60) * 1000,
    maxRetries: integer(env, "MAX_RETRIES", 2, 0, 3),
    retryBaseMs: integer(env, "RETRY_BASE_SECONDS", 2, 1, 10) * 1000,
  };
}
export function collegeDate(instant: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Confirmed source labels only. Keep the existing 311а identity and hashes stable. */
export const supportedGroups = [
 {id: "311а", label: "311а", aliases: ["311а", "311"]},
 {id: "1621а", label: "1621а", aliases: ["1621а"]},
] as const;
export type GroupId = typeof supportedGroups[number]["id"];
export function groupId(value: unknown): GroupId | null {
 return supportedGroups.find(g => g.aliases.some(a => normalizeLabel(a) === normalizeLabel(String(value ?? ""))))?.id ?? null;
}
export function isSupportedGroup(value: unknown): value is GroupId {
 return supportedGroups.some(g => g.id === value);
}
