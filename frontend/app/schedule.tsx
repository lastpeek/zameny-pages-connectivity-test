"use client";
import AppearanceSettings from "./appearance-settings";
import NotificationDays from "./notification-days";
import PushSettings from "./push-settings";
import ChangeJournal from "./change-journal";
import { BELL_SCHEDULES } from "../src/ui/bells";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Entry } from "../src/ui/api-state";
import {staticPath} from "../src/ui/static-path";
import {readStaticState, dataAge} from "../src/ui/static-state";
import { pilot, collegeDate, supportedGroups } from "../src/config";
import {
  GROUP_STORAGE_KEY,
  availableDates,
  entriesForDate,
  weekdayIndex,
  weekdayNavigation,
  resolveScheduleDate,
  weekdayUrl,
  readableDayMonth,
  readableDate,
  readableInstant,
  restoredGroup,
  searchGroups,
  stateBanner,
  weekday,
  validDate,
  type ApiState,
  type GroupOption,
} from "../src/ui/view";

// Keep keyboard focus inside the modal, including Chromium's browser-chrome boundary.
function keepDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const controls = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
    ),
  ).filter((node) => node.getClientRects().length > 0);
  const first = controls[0],
    last = controls.at(-1);
  if (!first || !last) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

type IconName =
  | "bell"
  | "chevron"
  | "close"
  | "clock"
  | "external"
  | "search"
  | "calendar"
  | "refresh"
  | "notice"
  | "mark";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14" />
        <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6m-5 4a8 8 0 0 0 14 5l3-3m0 6v-6h-6" />
      </>
    ),
    notice: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    ),
    mark: (
      <>
        <path d="M4 7h13m-4-4 4 4-4 4M20 17H7m4-4-4 4 4 4" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
function Notice({
  title,
  children,
  tone = "warning",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning" | "error" | "neutral";
}) {
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon name="notice" />
      <div>
        <p className="notice-title">{title}</p>
        <div className="notice-body">{children}</div>
      </div>
    </div>
  );
}
function RecordCard({
  entry,
  groupLabel,
  classification,
}: {
  entry: Entry;
  groupLabel: string;
  classification: string;
}) {
  // These are published source records, not a reconstructed final daily timetable.
  const knownChange =
    entry.changeType !== "unknown" && classification === "verified";
  const needsReview = !entry.pair || (!entry.subject && !knownChange);
  const kind = !knownChange
    ? "Занятие"
    : entry.changeType === "cancellation"
      ? "Отмена занятия"
      : entry.changeType === "replacement"
        ? "Замена в расписании"
        : "Занятие";
  const pair = entry.pair
    ? entry.pair.from === entry.pair.to
      ? `Пара ${entry.pair.from}`
      : `Пары ${entry.pair.from}–${entry.pair.to}`
    : "Пара требует проверки";
  return (
    <article
      className="record-card"
      aria-label={`${pair}. ${entry.subject || kind}`}
    >
      <div className="record-top">
        <span className="pair-label">{pair}</span>
        {(needsReview || knownChange) && (
          <span
            className={`status-label ${needsReview ? "review-label" : "verified-label"}`}
          >
            {needsReview ? "Неполные данные" : kind}
          </span>
        )}
      </div>
      <div className="record-meta">
        <time dateTime={entry.lessonDate}>
          {readableDate(entry.lessonDate, true)}
        </time>
        <span aria-hidden="true">·</span>
        <span className="group-chip">Группа {groupLabel}</span>
      </div>
      <p className="record-kind">{kind}</p>
      <h3>
        {entry.subject ||
          (knownChange && entry.changeType === "cancellation"
            ? "Занятие отменено"
            : "Описание не указано")}
      </h3>
      <p className="room">
        {entry.room ? (
          <>
            Кабинет <strong>{entry.room}</strong>
          </>
        ) : (
          "Кабинет в записи не указан"
        )}
      </p>
      {entry.teacher && <p className="room">Преподаватель <strong>{entry.teacher}</strong></p>}
      {entry.publishedTime && <p className="room">В источнике: {entry.publishedTime.start}–{entry.publishedTime.end}</p>}
      <details className="source-details">
        <summary>Данные первоисточника</summary>
        <div className="source-details-body">
          <p>
            {needsReview
              ? "Не все поля записи удалось прочитать. Уточните номер пары или описание в официальном документе. Отсутствующие значения не подставляются автоматически."
              : "Запись опубликованного источника. Мы показываем прочитанные поля буквально, не утверждая, что это полное итоговое расписание дня."}
          </p>
          <p>Подробные координаты ячеек не передаются публичным API. Для сверки откройте официальный источник.</p>
          <a href={pilot.officialPage} target="_blank" rel="noopener noreferrer">
            Открыть документ <Icon name="external" />
            <span className="sr-only"> (в новой вкладке)</span>
          </a>
        </div>
      </details>
    </article>
  );
}
const fallbackGroups: GroupOption[] = supportedGroups.map(g=>({...g,aliases:[...g.aliases]}));
export default function Schedule() {
  const [pushOpen, setPushOpen] = useState(false);
  const [clock,setClock]=useState(0);
  useEffect(()=>{
    const tick=()=>{const now=Date.now();setClock(now);const today=collegeDate(now,pilot.timeZone);setState(s=>s&&s.today!==today?{...s,today}:s)};
    tick();const timer=setInterval(tick,30000);
    const visible=()=>{if(document.visibilityState==='visible')tick()};document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
  },[]);
  const [offline, setOffline] = useState(false),
    [receivedAt, setReceivedAt] = useState<string | null>(null),
    [bindingError, setBindingError] = useState<string | null>(null);

  const [remoteState, setState] = useState<ApiState | null>(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [clientError, setClientError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null),
    [selectedWeekday, setSelectedWeekday] = useState<number | null>(null),
    [linkedDate, setLinkedDate] = useState("");
  const [dateNotice, setDateNotice] = useState("");
  const previousAutomaticDate = useRef<{group: string; index: number; date: string} | null>(null);
  const weekdayStrip = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(""),
    [storageUnavailable, setStorageUnavailable] = useState(false);
  const groupDialog = useRef<HTMLDialogElement>(null),
    notificationDialog = useRef<HTMLDialogElement>(null),
    bellsDialog = useRef<HTMLDialogElement>(null),
    searchInput = useRef<HTMLInputElement>(null);
  const requestRef = useRef(false),
    stored = useRef<string | null>(null);
  const state = remoteState?.group===selectedGroup ? remoteState : null;
  const groups = fallbackGroups;
  const [switching,setSwitching]=useState(false);
  useEffect(() => {
    try {
      stored.current = localStorage.getItem(GROUP_STORAGE_KEY);
    } catch {
      setStorageUnavailable(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (
      (!params.get("group") || restoredGroup(params.get("group"), fallbackGroups)) &&
      validDate(params.get("date") || "")
    ) {
      setLinkedDate(params.get("date")!);
    }
    setSelectedGroup(restoredGroup(params.get("group"),fallbackGroups)||restoredGroup(stored.current,fallbackGroups)||pilot.group);
  }, []);
  useEffect(() => {
    if(!selectedGroup)return;
    setLoading(true);setClientError(null);
    setOffline(!navigator.onLine);
    let inFlight=false;
    let alive = true;
    let activeController: AbortController | null = null;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      const controller = new AbortController();
      activeController = controller;
      if (alive) setRefreshing(true);
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(staticPath("/stage1-data/"+encodeURIComponent(selectedGroup!)+"/schedule.json"), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("API unavailable");
        const data = readStaticState(await response.json(),Date.now(),selectedGroup!);
        if (
          data.group!==selectedGroup ||
          !Array.isArray(data.entries) ||
          !Array.isArray(data.coverage) ||
          !Array.isArray(data.groupCatalog?.groups) ||
          !data.today
        )
          throw new Error("API format");
        if (alive) {
          const received = new Date().toISOString();
          setReceivedAt(received);
          setOffline(!navigator.onLine);
          if ("serviceWorker" in navigator) {
            void Promise.race([
              navigator.serviceWorker.ready,
              new Promise<undefined>((resolve) =>
                setTimeout(() => resolve(undefined), 5000),
              ),
            ])
              .then((reg) =>
                reg?.active?.postMessage({
                  type: "STATE_OBSERVED",
                  receivedAt: received,
                  lastSuccessfulCheck: data.lastSuccessfulCheck,
                }),
              )
              .catch(() => {});
          }
          setState(data);
          setClientError(null);

        }
      } catch {
        if (alive)
          setClientError(
            "Не удалось получить данные сервиса. Попробуйте обновить экран позже.",
          );
      } finally {
        clearTimeout(timeout);
        inFlight = false;
        if (alive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60000);
    const manual = () => void refresh();
    window.addEventListener("pilot:refresh", manual);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const networkChanged = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) void refresh();
    };
    window.addEventListener("online", networkChanged);
    window.addEventListener("offline", networkChanged);
    return () => {
      alive = false;
      activeController?.abort();
      clearInterval(interval);
      window.removeEventListener("pilot:refresh", manual);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", networkChanged);
      window.removeEventListener("offline", networkChanged);
      inFlight = false;
    };
  }, [selectedGroup]);
  // Each refresh has a separate timeout; failed requests do not poison later refreshes.
  const current =
    groups.find((g) => g.id === selectedGroup) ||
    {id:"",label:"…",aliases:[]};
  const dates = state ? availableDates(state, current.id) : [];
  const weekdayOptions = weekdayNavigation(state?.today || null, dates);
  const collegeWeekday = state?.today ? weekdayIndex(state.today) : null;
  const activeWeekday =
    selectedWeekday ??
    (collegeWeekday && collegeWeekday <= 5 ? collegeWeekday : 1);
  const day = resolveScheduleDate(state?.today || null, dates, activeWeekday, linkedDate);
  const pastDate = Boolean(day && state?.today && day < state.today);
  useEffect(() => {
    if (!state || loading || linkedDate) {
      previousAutomaticDate.current = null;
      return;
    }
    const previous = previousAutomaticDate.current;
    if (previous && previous.group === current.id && previous.index === activeWeekday && previous.date !== day) {
      setDateNotice(day
        ? `Опубликованные даты обновились. Открыто: ${weekday(day)}, ${readableDate(day)}.`
        : "Расписание на этот день ещё не опубликовано. Ранее выбранной даты больше нет в доступном источнике.");
    }
    previousAutomaticDate.current = {group: current.id, index: activeWeekday, date: day};
  }, [state, loading, linkedDate, current.id, activeWeekday, day]);
  // Scroll only the horizontal strip, never jump the whole page on initial load.
  useEffect(() => {
    const strip = weekdayStrip.current;
    if (!strip) return;
    const reveal = () => {
      const active = strip.querySelector<HTMLElement>(
        'button[aria-selected="true"]',
      );
      if (!active) return;
      const box = strip.getBoundingClientRect(),
        target = active.getBoundingClientRect();
      if (target.left < box.left + 6)
        strip.scrollLeft -= box.left + 6 - target.left;
      else if (target.right > box.right - 6)
        strip.scrollLeft += target.right - box.right + 6;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [day]);
  const entries =
    state && day ? entriesForDate(state.entries, current.id, day) : [];
  const coverage = state?.coverage.find((c) => c.date === day);
  const banner = state ? stateBanner({...state, isStale:state.isStale || Boolean(clientError) || offline || Boolean(state.lastSuccessfulCheck && (clock||Date.now())-Date.parse(state.lastSuccessfulCheck)>1800000)}) : null;
  const timeZone = state?.timeZone || pilot.timeZone;
  async function selectGroup(group: GroupOption) {
    if(switching)return;
    setSwitching(true);setBindingError(null);
    try {
      // Stage 1 changes the displayed group only; no subscription API is connected.
      setState(null);setLoading(true);setSelectedGroup(group.id);setSelectedWeekday(null);setLinkedDate('');setDateNotice('');
      stored.current=group.id;
      try{localStorage.setItem(GROUP_STORAGE_KEY,group.id)}catch{setStorageUnavailable(true)}
      const url=new URL(location.href);url.searchParams.delete('date');url.searchParams.delete('dates');url.searchParams.delete('group');history.replaceState(null,'',url.pathname+url.search+url.hash);
      groupDialog.current?.close();
    } catch(e:any){setBindingError(e.message)} finally{setSwitching(false)}
  }
  function openGroups() {
    setQuery("");
    groupDialog.current?.showModal();
    requestAnimationFrame(() => searchInput.current?.focus());
  }
  const visibleGroups = searchGroups(groups, query);
  const noCurrentData = state?.status === "not_loaded";
  return (
    <>
      <a className="skip-link" href="#schedule-content">
        Перейти к записям
      </a>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="mark" />
            </span>
            <span>
              zameny<span className="brand-caption">расписание колледжа</span>
            </span>
          </div>
          <div className="topbar-actions">
          <AppearanceSettings />
          <button
            type="button"
            className="button button-quiet notifications-trigger"
            onClick={() => {
              setPushOpen(true);
              notificationDialog.current?.showModal();
            }}
            aria-label="Настроить уведомления"
          >
            <Icon name="bell" />
            <span>Уведомления</span>
          </button>
          </div>
        </header>
        <main className="main-layout">
          <section className="overview" aria-labelledby="page-title">
            <p className="eyebrow">КОЛЛЕДЖ · РАСПИСАНИЕ</p>
            <h1 id="page-title" aria-label={`${current.label} — расписание`}>
              <span
                className={`title-group${current.label.length > 18 ? " long-group-title" : ""}`}
              >
                {current.label}
              </span>
              <span className="title-subtitle">расписание занятий</span>
            </h1>
            <div className="group-control">
              <span className="field-label" id="group-field-label">
                Ваша группа
              </span>
              <button
                type="button"
                className="group-trigger"
                onClick={openGroups}
                aria-haspopup="dialog"
                aria-labelledby="group-field-label selected-group"
              >
                <span id="selected-group">{current.label}</span>
                <span className="change-group">
                  Выбрать <Icon name="chevron" />
                </span>
              </button>
            </div>
            <button
              type="button"
              className="button button-quiet bells-trigger"
              aria-haspopup="dialog"
              onClick={() => bellsDialog.current?.showModal()}
            >
              <Icon name="clock" /> Расписание звонков
            </button>
            {storageUnavailable && (
              <p className="storage-warning" role="status">
                Браузер не разрешил сохранить группу. Выбор действует в этой
                вкладке.
              </p>
            )}
            <div className="freshness">
              <Icon name="clock" />
              <div>
                <p>
                  {state?.lastSuccessfulCheck
                    ? "Успешная проверка"
                    : "Время проверки"}
                </p>
                <p className="check-time">
                  {loading
                    ? "Загружаем…"
                    : readableInstant(
                        state?.lastSuccessfulCheck || null,
                        timeZone,
                      )}
                </p>
              </div>
            </div>
            <p className="field-hint" data-testid="data-age">С последней успешной проверки: {dataAge(state?.lastSuccessfulCheck||null,clock||Date.now())}</p>
            {state?.pages&&<p className="field-hint">Снимок выпуска подготовлен: {readableInstant(state.pages.generatedAt,timeZone)}</p>}
            <p className="field-hint">Последняя попытка: {state?.lastAttempt ? readableInstant(state.lastAttempt, timeZone) : "пока нет"}</p>
            <p className="field-hint">Изменения замечены: {state?.dataChangedAt ? readableInstant(state.dataChangedAt, timeZone) : "пока нет"}</p>
            <button
              type="button"
              className="refresh-button"
              disabled={refreshing}
              onClick={() => window.dispatchEvent(new Event("pilot:refresh"))}
            >
              <Icon name="refresh" />
              {refreshing ? "Обновляем экран…" : "Обновить экран"}
            </button>
            <p className="refresh-hint">
              Без запуска проверки источника.
            </p>
            <aside className="source-check-note" aria-labelledby="source-check-note-title">
              <div className="source-check-note-heading">
                <Icon name="notice" />
                <p id="source-check-note-title">Готовые данные из Worker публикуются на Pages примерно раз в 15 минут</p>
              </div>
            </aside>
          </section>
          <section
            className="feed"
            id="schedule-content"
            tabIndex={-1}
            aria-labelledby="feed-heading"
            aria-busy={loading}
          >
            <div
              className="date-controls"
              ref={weekdayStrip}
              role="tablist"
              aria-label="День недели"
              aria-describedby="weekday-navigation-hint"
            >
              {weekdayOptions.map((option) => (
                <button
                  key={option.index}
                  type="button"
                  role="tab"
                  aria-selected={!linkedDate && activeWeekday === option.index}
                  tabIndex={activeWeekday === option.index ? 0 : -1}
                  onKeyDown={(event) => {
                    const buttons = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
                    const index = buttons.indexOf(event.currentTarget);
                    const next = event.key === "ArrowRight" ? (index + 1) % buttons.length : event.key === "ArrowLeft" ? (index - 1 + buttons.length) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : -1;
                    if (next >= 0) { event.preventDefault(); buttons[next].focus(); buttons[next].click(); }
                  }}
                  onClick={() => {
                    previousAutomaticDate.current = null;
                    setDateNotice("");
                    setLinkedDate("");
                    setSelectedWeekday(option.index);
                    window.history.replaceState(null, "", weekdayUrl(window.location.href));
                  }}
                >
                  <span>{option.label}</span>
                  <span className="weekday-tab-date">{option.date ? readableDayMonth(option.date) : "Не опубликовано"}</span>
                  {option.past && <span className="weekday-tab-past">Прошедшая дата</span>}
                </button>
              ))}
            </div>
            <p className="weekday-scroll-hint">Листайте дни влево и вправо</p>
            <p className="weekday-date-hint" id="weekday-navigation-hint">
              {linkedDate
                ? "Открыта выбранная дата. Вкладка дня вернёт актуальную."
                : "Даты — на вкладках. Прошедшие отмечены."}
            </p>
            {pastDate && <p className="past-date-note">{linkedDate
              ? "Прошедшая дата, выбрана вами."
              : "Прошедшая дата. Новая ещё не опубликована."}</p>}
            {dateNotice && <p className="date-update-note" role="status" aria-live="polite">{dateNotice}</p>}
            <div className="feed-heading">
              <div>
                <p className="eyebrow">
                  {day ? weekday(day) : "ОПУБЛИКОВАННЫЕ ДАННЫЕ"}
                </p>
                <h2 id="feed-heading">
                  {day ? readableDate(day) : "Расписание занятий"}
                </h2>
              </div>
              {!loading && entries.length > 0 && (
                <span className="entry-count">
                  {entries.length}{" "}
                  {entries.length === 1
                    ? "запись"
                    : entries.length < 5
                      ? "записи"
                      : "записей"}
                </span>
              )}
            </div>
            <div
              className="client-announcement sr-only"
              role="status"
              aria-live="polite"
            >
              {!loading && day
                ? `${readableDate(day)}. Записей: ${entries.length}.`
                : ""}
            </div>
            {offline && (
              <Notice tone="warning" title="Нет подключения к интернету">
                Показаны только ранее полученные данные.{" "}
                {receivedAt
                  ? `Ответ сервиса получен: ${readableInstant(receivedAt, timeZone)} (Владивосток).`
                  : "Время получения на устройстве неизвестно."}{" "}
                Свежесть сейчас не подтверждена.
              </Notice>
            )}
            {bindingError && (
              <Notice
                tone="error"
                title="Привязка уведомлений требует проверки"
              >
                {bindingError}
              </Notice>
            )}
            {clientError && (
              <Notice
                tone="error"
                title={
                  state
                    ? "Не удалось обновить экран"
                    : "Сервис временно недоступен"
                }
              >
                {state
                  ? "Показаны ранее полученные данные. Свежесть сейчас подтвердить не удалось."
                  : clientError}
              </Notice>
            )}
            {banner && (
              <Notice title={banner.title} tone={banner.tone}>
                {banner.body}
              </Notice>
            )}
            {loading ? (
              <div
                className="loading-state"
                role="status"
                aria-label="Загрузка данных"
              >
                <p>Загружаем сохранённые данные…</p>
                {[1, 2].map((n) => (
                  <div className="skeleton-card" key={n} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : state && noCurrentData ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="calendar" />
                </span>
                <h3>Данных ещё нет</h3>
                <p>
                  Сервер ещё не выполнил успешную загрузку. Загляните позже или
                  откройте официальный источник.
                </p>
              </div>
            ) : state && entries.length > 0 ? (
              <>
                <div className="record-list">
                  {entries.map((e) => (
                    <RecordCard
                      key={e.id}
                      entry={e}
                      groupLabel={current.label}
                      classification={state.classification}
                    />
                  ))}
                </div>
              </>
            ) : state && !clientError ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="calendar" />
                </span>
                <h3>
                  {banner && !state.lastSuccessfulCheck
                    ? "Надёжных данных пока нет"
                    : !day
                      ? "Расписание на этот день ещё не опубликовано"
                      : coverage?.groupFound
                        ? "Записей для группы не найдено"
                        : "На эту дату нет подтверждённых данных"}
                </h3>
                <p>
                  {banner && !state.lastSuccessfulCheck
                    ? "Когда источник снова удастся прочитать, здесь появятся записи. Пока расписание на эту дату неизвестно."
                    : coverage?.groupFound
                      ? "В доступном источнике не найдено записей для выбранной группы и даты. Это не означает, что занятий нет."
                      : "В сохранённом источнике нет подтверждённого блока вашей группы на эту дату. Проверьте другие даты или первоисточник."}
                </p>
              </div>
            ) : null}
            {day && <><NotificationDays/><ChangeJournal key={current.id+day} data={state?.pages?.journals[day]||null} /></>}
            {dates.length > 0 && <details className="other-dates">
              <summary>Другие даты</summary>
              <label>Открыть точную опубликованную дату
                <select aria-label="Другие даты" value={dates.includes(day) ? day : ""} onChange={e => {
                  if (!validDate(e.target.value)) return;
                  previousAutomaticDate.current = null;
                  setDateNotice("");
                  setLinkedDate(e.target.value);
                  const url = new URL(window.location.href);
                  url.searchParams.set("date", e.target.value);
                  url.searchParams.delete("dates");
                  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
                }}>
                  <option value="" disabled>Выберите дату</option>
                  {dates.map(d => <option key={d} value={d}>{readableDate(d)}{state?.today && d < state.today ? " · прошедшая" : ""}</option>)}
                </select>
              </label>
            </details>}
            <details className="schedule-help" id="schedule-help">
              <summary>Как читать расписание</summary>
              <p><strong>Проверки и свежесть.</strong> Существующий сервер проверяет источник раз в 15 минут. GitHub Actions отдельно публикует готовое расписание и журнал на Pages примерно раз в 15 минут; возможны задержки. При ошибке остаётся предыдущий корректный выпуск. «Обновить экран» читает файлы Pages, не запускает проверку источника. Вверху отдельно показаны время успешной проверки, давность данных и время подготовки выпуска.</p>
              <p><strong>Выбор даты.</strong> Вкладка дня открывает ближайшую опубликованную дату сегодня или в будущем. Если её нет — последнюю прошедшую, с пометкой. Если данных нет совсем, дата не подставляется. Дата, открытая по ссылке или через «Другие даты», не переключается сама; нажатие вкладки возвращает автоматический выбор.</p>
              <p><strong>Что показано.</strong> Это опубликованные записи источника, а не подтверждение полного расписания дня. Пустая ячейка и исчезновение записи не означают отмену занятия. Жёлтая заливка не трактуется; «С/З» и пара «0» показаны буквально.</p>
              <p><strong>Группа.</strong> Подключены 311а и 1621а. Выбор группы сохраняется на устройстве. Это не полный список групп колледжа.</p>
              <p><strong>Журнал изменений.</strong> Сравниваются записи одной группы и точной даты: предмет, преподаватель, кабинет, номер пары и явно указанное время. Первая корректная загрузка создаёт исходное состояние, без рассылки старых событий.</p>
              <p><strong>Уведомления.</strong> В этой промежуточной сборке ещё не подключены. Разрешение браузера не запрашивается, подписки не создаются и не меняются. Рабочая Deno-копия остаётся без изменений.</p>
            </details>
            <div className="official-source">
              <a
                className="button source-button"
                href={state?.sourceUrl || pilot.officialPage}
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть официальный источник <Icon name="external" />
                <span className="sr-only"> (в новой вкладке)</span>
              </a>
            </div>
          </section>
        </main>
        <footer className="footer">
          <p>Неофициальный сервис. Первоисточник — сайт колледжа</p>
          <p className="project-contact">Вопросы или идеи? <a href="https://t.me/matvidel34" target="_blank" rel="noopener noreferrer">Напишите @matvidel34<span className="sr-only"> в Telegram (в новой вкладке)</span></a></p>
          <p>Создатель проекта — matvidel34</p>
        </footer>
      </div>
      <dialog
        onKeyDown={keepDialogFocus}
        ref={bellsDialog}
        className="dialog bells-dialog"
        aria-labelledby="bells-title"
      >
        <div className="dialog-top">
          <div>
            <p className="eyebrow">ВЛАДИВОСТОК · UTC+10</p>
            <h2 id="bells-title">Расписание звонков</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => bellsDialog.current?.close()}
            aria-label="Закрыть расписание звонков"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="bells-tables">
          {BELL_SCHEDULES.map((schedule) => (
            <table className="bells-table" key={schedule.id}>
              <caption>{schedule.label}</caption>
              <thead>
                <tr>
                  <th scope="col">Пара</th>
                  <th scope="col">Время</th>
                </tr>
              </thead>
              <tbody>
                {schedule.rows.map((row) => (
                  <tr key={row.pair}>
                    <th scope="row">{row.pair} пара</th>
                    <td>
                      <time>{row.start}</time> – <time>{row.end}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <button
          className="button button-primary full-width"
          type="button"
          onClick={() => bellsDialog.current?.close()}
        >
          Понятно
        </button>
      </dialog>
      <dialog
        onKeyDown={keepDialogFocus}
        ref={groupDialog}
        className="dialog"
        aria-labelledby="groups-title"
        aria-describedby="groups-note"
      >
        <div className="dialog-top">
          <div>
            <p className="eyebrow">НАСТРОЙКИ ПРОСМОТРА</p>
            <h2 id="groups-title">Ваша группа</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => groupDialog.current?.close()}
            aria-label="Закрыть выбор группы"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-description" id="groups-note">
          {state?.groupCatalog.note ||
            `Подключены 311а и 1621а. Это не полный список групп колледжа.`}
        </p>
        <label className="field-label" htmlFor="group-search">
          Поиск группы
        </label>
        <div className="search-field">
          <Icon name="search" />
          <input
            ref={searchInput}
            id="group-search"
            type="text"
            role="searchbox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название или номер"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="sr-only" role="status">
          Найдено групп: {visibleGroups.length}
        </p>
        {visibleGroups.length ? (
          <ul className="group-options">
            {visibleGroups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => selectGroup(g)}
                  aria-label={`Выбрать группу ${g.label}`}
                >
                  <span>
                    <strong>{g.label}</strong>
                    <small>
                      Подтверждённое обозначение: {g.aliases.join(" / ")}
                    </small>
                  </span>
                  {g.id === current.id && (
                    <span className="selected-label">Выбрана</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-groups" role="status">
            Такая группа не найдена среди подключённых к сервису. Полного
            справочника колледжа пока нет.
          </p>
        )}
        {bindingError&&<p role="alert">{bindingError}</p>}
        <p className="dialog-footnote">
          Выбор и оформление хранятся на устройстве без срока со стороны приложения. Очистка данных сайта или ограничения браузера могут удалить их. В этой промежуточной сборке меняется только просматриваемая группа; уведомления пока не подключены.
        </p>
      </dialog>
      <dialog
        onKeyDown={keepDialogFocus}
        ref={notificationDialog}
        className="dialog"
        aria-labelledby="notifications-title"
        onClose={() => setPushOpen(false)}
      >
        <div className="dialog-top">
          <div>
            <p className="eyebrow">НАСТРОЙКИ</p>
            <h2 id="notifications-title">Уведомления</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => {
              setPushOpen(false);
              notificationDialog.current?.close();
            }}
            aria-label="Закрыть настройки уведомлений"
          >
            <Icon name="close" />
          </button>
        </div>
        <PushSettings group={current.id} open={pushOpen} />
        <button
          className="button button-primary full-width"
          type="button"
          onClick={() => {
            setPushOpen(false);
            notificationDialog.current?.close();
          }}
        >
          Понятно
        </button>
      </dialog>
      <noscript>
        <div className="noscript-message">
          Для загрузки сохранённых записей нужен JavaScript.{" "}
          <a href={pilot.officialPage}>
            Откройте официальный источник колледжа.
          </a>
        </div>
      </noscript>
    </>
  );
}
