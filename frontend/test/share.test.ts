import test from "node:test";
import assert from "node:assert/strict";
import type { Entry } from "../src/ui/api-state";
import { SITE_URL, SHARE_TEXT_LIMIT, scheduleShareText, telegramShareUrl } from "../src/ui/share";

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: "id",
  group: "311а",
  lessonDate: "2026-11-11",
  pair: { from: 3, to: 3 },
  changeType: "unknown",
  subject: "Основы безопасности и защиты Родины",
  room: "21",
  teacher: "Оганесян А.А.",
  ...over,
});

test("share text is a readable schedule without markup or extra footer", () => {
  const text = scheduleShareText([entry()], "311а", "2026-11-11");
  assert.equal(
    text,
    [
      "Замены · среда, 11 ноября",
      "Группа 311а",
      "",
      "🔹 3 пара · 12:45–14:15",
      "Основы безопасности и защиты Родины",
      "каб. 21 · Оганесян А.А.",
      "",
      SITE_URL,
    ].join("\n"),
  );
  assert.ok(!text.includes("Владивосток"));
  assert.ok(text.endsWith(`\n\n${SITE_URL}`));
});

test("missing room, teacher or pair stays literal instead of invented", () => {
  const text = scheduleShareText(
    [
      entry({ pair: null, room: null, teacher: null, subject: null }),
      entry({ pair: { from: 1, to: 1 }, room: null, subject: null }),
    ],
    "1621а",
    "2026-11-10",
  );
  assert.ok(text.includes("Пара\n—"));
  assert.ok(!text.includes("каб."));
  assert.ok(text.includes("1 пара · 08:45–10:15"));
});

test("empty day still shares the date and group, never an invented pair", () => {
  const text = scheduleShareText([], "311а", "2026-11-11");
  assert.equal(text, `Замены · среда, 11 ноября\nГруппа 311а\n\n${SITE_URL}`);
});

test("long schedules drop whole pairs and stay inside the Telegram limit", () => {
  const many = Array.from({ length: 400 }, (_, i) =>
    entry({ id: `id-${i}`, subject: `Предмет ${i} с достаточно длинным названием` }),
  );
  const text = scheduleShareText(many, "311а", "2026-11-11");
  assert.ok(text.length <= SHARE_TEXT_LIMIT);
  assert.ok(text.includes("…\n\n"));
  assert.ok(text.endsWith(SITE_URL));
  assert.ok(text.startsWith("Замены · среда, 11 ноября"));
});

test("pairs are separated by a divider", () => {
  const text = scheduleShareText(
    [entry(), entry({ id: "b", pair: { from: 4, to: 4 }, subject: "История" })],
    "311а",
    "2026-11-11",
  );
  assert.ok(text.includes("Основы безопасности и защиты Родины"));
  assert.ok(text.includes("\n──────────────\n🔹 4 пара"));
});

test("share url keeps the site link only at the bottom of the text", () => {
  const text = scheduleShareText([entry()], "311а", "2026-11-11");
  const url = telegramShareUrl(text);
  assert.ok(url.startsWith("https://t.me/share/url?"));
  const query = new URL(url).searchParams;
  assert.notEqual(query.get("url"), SITE_URL);
  assert.equal(query.get("text"), text);
  assert.ok((query.get("text") ?? "").endsWith(SITE_URL));
});
