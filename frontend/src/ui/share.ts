import type { Entry } from "./api-state";
import { bellRange } from "./pair-timer";
import { readableDayMonth, weekday } from "./view";

/**
 * Public site is the last line of the message, so Telegram linkifies it. The
 * `?tg` marker gives Telegram a fresh preview cache entry: metadata fixes on
 * the bare domain stay invisible while the old preview is cached.
 */
export const SITE_URL = "https://nggpk-zameny.ru/?tg";
/**
 * Telegram accepts 4096 characters per message. The text keeps a reserve for
 * the site link and drops whole pairs instead of cutting a line in the middle.
 */
export const SHARE_TEXT_LIMIT = 3800;

const pairTitle = (entry: Entry) => {
  const from = entry.pair?.from;
  if (from === undefined || from === null || from < 0) return "Пара";
  const time = bellRange(entry.lessonDate, from);
  return time ? `${from} пара · ${time.start}–${time.end}` : `${from} пара`;
};

const pairBlock = (entry: Entry) => {
  const lines = [pairTitle(entry), entry.subject || "—"];
  const meta = [entry.room ? `каб. ${entry.room}` : "", entry.teacher || ""]
    .filter(Boolean)
    .join(" · ");
  if (meta) lines.push(meta);
  return lines.join("\n");
};

/**
 * Plain text that reads as a schedule inside the messenger: no markup, no
 * dependence on the site being opened. Only published records are shared.
 */
export function scheduleShareText(
  entries: Entry[],
  groupLabel: string,
  day: string,
): string {
  const head = [
    `Замены · ${weekday(day)}, ${readableDayMonth(day)}`,
    `Группа ${groupLabel}`,
  ].join("\n");
  if (!entries.length) return `${head}\n\n${SITE_URL}`;
  const blocks: string[] = [];
  let size = head.length + SITE_URL.length + 4;
  for (const entry of entries) {
    const block = pairBlock(entry);
    if (size + block.length + 2 > SHARE_TEXT_LIMIT) {
      blocks.push("…");
      break;
    }
    blocks.push(block);
    size += block.length + 2;
  }
  return [head, ...blocks, SITE_URL].join("\n\n");
}

/**
 * t.me/share/url rejects an empty `url` (redirects to telegram.org), and any
 * real URL is printed above the text. An invisible placeholder keeps the
 * dialog working while the site link stays the last line of the message.
 */
const URL_PLACEHOLDER = "\u200B";

export function telegramShareUrl(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(URL_PLACEHOLDER)}&text=${encodeURIComponent(text)}`;
}
