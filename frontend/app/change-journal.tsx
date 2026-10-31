'use client';
import {readableInstant} from '../src/ui/view';
import type {RecordValue,Journal} from '../src/ui/static-state';
function value(v:RecordValue|null){if(!v)return '—';return [`Пара ${v.pair.from===v.pair.to?v.pair.from:`${v.pair.from}–${v.pair.to}`}`,v.subject||'Предмет не указан',v.teacher,v.room?`Кабинет ${v.room}`:null,v.publishedTime?`${v.publishedTime.start}–${v.publishedTime.end}`:null].filter(Boolean).join(' · ');}
export default function ChangeJournal({data}:{data:Journal|null}){
 const error=!data;
 return <section className="change-journal" aria-label="Изменения записей источника"><h3>Изменения записей источника</h3><p>Исчезновение записи не означает отмену занятия.</p>
 {error?<p role="status">Журнал сейчас недоступен. Это не означает, что изменений нет.</p>:!data?<p role="status">Загружаем журнал…</p>:<>
 {data.dayStatus?.heldReason&&<p role="status">Данные этой даты неполны или неоднозначны. Предыдущее корректное состояние сохранено.</p>}
 {!data.events.length?<p>Изменений этой даты пока не зафиксировано.</p>:data.events.map(e=><details key={e.sequence}><summary>{readableInstant(e.checkedAt,'Asia/Vladivostok')} · {e.kind==='published'?'первая публикация записей этой даты':'изменения записей'}</summary>{e.details.map((d,i)=><div key={i} className="change-detail"><p><strong>{d.kind==='removed'?'Запись больше не указана в источнике':d.kind==='added'?'Добавлена запись':'Запись изменена'}</strong></p>{d.before&&<p>Было: {value(d.before)}</p>}{d.after&&<p>Стало: {value(d.after)}</p>}</div>)}</details>)}
 </>}
 </section>;
}
