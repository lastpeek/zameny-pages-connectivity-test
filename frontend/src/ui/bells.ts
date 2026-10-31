/** Manual transcription of docs/bell-times-source.jpg supplied by the user.
 * No effective date is visible. This is not an automatically refreshed feed.
 * All times are local to the college: Asia/Vladivostok (UTC+10).
 */
export const BELL_SOURCE_NOTE =
  "Время по Владивостоку. Перенесено с фотографии владельца сервиса. Дата действия на ней не указана; звонки не обновляются автоматически.";
export const BELL_SCHEDULES = [
  {
    id: "monday",
    label: "Понедельник",
    rows: [
      { pair: 0, start: "08:45", end: "09:15" },
      { pair: 1, start: "09:25", end: "10:55" },
      { pair: 2, start: "11:05", end: "12:35" },
      { pair: 3, start: "13:25", end: "14:55" },
      { pair: 4, start: "15:05", end: "16:35" },
      { pair: 5, start: "16:45", end: "18:15" },
      { pair: 6, start: "18:25", end: "19:55" },
      { pair: 7, start: "20:05", end: "21:35" },
    ],
  },
  {
    id: "tuesday-saturday",
    label: "Вторник–суббота",
    rows: [
      { pair: 1, start: "08:45", end: "10:15" },
      { pair: 2, start: "10:25", end: "11:55" },
      { pair: 3, start: "12:45", end: "14:15" },
      { pair: 4, start: "14:25", end: "15:55" },
      { pair: 5, start: "16:05", end: "17:35" },
      { pair: 6, start: "17:45", end: "19:15" },
      { pair: 7, start: "19:25", end: "20:55" },
    ],
  },
] as const;
