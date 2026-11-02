'use client';
import {useEffect,useRef,useState} from 'react';
import InstallGuide from './install-guide';
import {makeVerificationCode} from '../src/ui/push-proof';
import {type Config,request,registration,syncBinding,pendingDeletion,pauseBinding,markDisabled,clearPendingDeletion} from '../src/ui/push-client';
const bytes=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
export default function PushSettings({open,group}:{open:boolean;group:string}){
 const [c,setC]=useState<Config|null>(null),[changes,setChanges]=useState(false),[publications,setPublications]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[warning,setWarning]=useState('');
 const [verificationCode,setVerificationCode]=useState('');
 const lock=useRef(false);
 async function run(f:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);try{await f()}finally{lock.current=false;setBusy(false)}}
 async function load(){const p=await pendingDeletion();setPending(p);const value:Config=await request('GET');setC(value);if(value.device?.active){setChanges(value.device.changes);setPublications(value.device.publications)}if(!p){try{await syncBinding(value.device);setWarning('')}catch{setWarning('Не удалось обновить обработчик уведомлений. Проверьте соединение и повторите.')}}return value}
 useEffect(()=>{setVerificationCode('');if(!open)return;void run(async()=>{setMessage('Проверяем состояние подписки…');try{await load();setMessage('Состояние сервера проверено. Доставка на телефон этой проверкой не подтверждается.')}catch{setC(null);setMessage('Не удалось проверить состояние подписки. Попробуйте ещё раз.')}})},[open]);
 async function check(){await run(async()=>{setMessage('Проверяем состояние подписки…');try{if(await pendingDeletion()){await request('POST',{action:'unsubscribe'});await clearPendingDeletion();setPending(false)}await load();setMessage('Состояние сервера проверено. Доставка на телефон этой проверкой не подтверждается.')}catch{setC(null);setMessage('Не удалось проверить состояние или завершить удаление. Попробуйте ещё раз.')}})}
 async function verifyDevice(){await run(async()=>{setVerificationCode('');try{if(await pendingDeletion())throw Error();const latest:Config=await request('GET'),d=latest.device;if(!d?.active||d.group!=='311а'||!/^[a-f0-9]{64}$/.test(d.bindingId))throw Error();setC(latest);setVerificationCode(await makeVerificationCode(d.bindingId));setMessage('Код создан для активной подписки 311а. Он не управляет подпиской и не содержит её адрес или ключи.');}catch{setMessage('Не удалось создать код для активной подписки 311а. Проверьте состояние подписки.')}})}
 async function enable(){if(!c||!consent||!(changes||publications)||pending)return;await run(async()=>{try{
  if(c.device?.active&&c.device.group!==group)throw Error('Сначала подтвердите переключение группы уведомлений ниже.');
  const installed=matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone,ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!installed)throw Error('Откройте zameny со значка на экране Домой, не из вкладки Safari.');
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('Web Push недоступен в этом режиме.');
  if(await Notification.requestPermission()!=='granted')throw Error('Разрешение не получено.');
  const reg=await registration();await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(sub&&!c.device?.active){if(!await sub.unsubscribe())throw Error('Не удалось отключить прежнюю подписку браузера.');sub=null}
  sub=sub||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(c.publicKey)});const s=sub.toJSON();
  await pauseBinding();await request('POST',{action:'subscribe',group,changes,publications,consent:true,subscription:{endpoint:s.endpoint,keys:s.keys}});setConsent(false);const updated=await load();if(!updated.device?.active||updated.device.group!==group)throw Error('Не удалось подтвердить сохранение. Проверьте состояние подписки.');setMessage('Настройки сохранены. Уведомления будут только о новых событиях после подключения.');
 }catch(e){setMessage(e instanceof Error&&/^[А-Яа-яЁё]/.test(e.message)?e.message:'Не удалось подтвердить изменение. На устройстве показ уведомлений приостановлен; проверьте состояние и повторите при необходимости.')}})}
 async function switchGroup(){if(!c?.device?.active||c.device.group===group||!confirm(`Переключить уведомления с группы ${c.device.group} на ${group}?`))return;await run(async()=>{try{await pauseBinding();await request('POST',{action:'switch_group',group,expectedGroup:c.device!.group,expectedVersion:c.device!.bindingVersion});const updated=await load();if(!updated.device?.active||updated.device.group!==group)throw Error();setMessage('Группа уведомлений переключена. Старые события не рассылаются.')}catch{setMessage('Переключение не подтверждено. На устройстве показ уведомлений приостановлен; проверьте состояние и повторите при необходимости.')}})}
 async function disable(){await run(async()=>{let localMarked=false,browserOff=false,serverOff=false;try{await markDisabled();localMarked=true;setPending(true)}catch{}try{const reg=await registration(),sub=await reg.pushManager.getSubscription();browserOff=!sub||await sub.unsubscribe()}catch{}try{await request('POST',{action:'unsubscribe'});serverOff=true;if(localMarked){await clearPendingDeletion();setPending(false)}setC(null)}catch{}setConsent(false);if(localMarked&&browserOff&&serverOff){try{await load()}catch{}setMessage('Уведомления отключены, подписка удалена с сервера.')}else setMessage(`${browserOff?'Получение в браузере отключено.':'Не удалось подтвердить отключение в браузере.'} ${serverOff?'Подписка удалена с сервера.':'Удаление на сервере не подтверждено; нажмите «Проверить состояние подписки», когда появится связь.'}${!localMarked?' Не удалось сохранить локальное состояние; проверьте настройки браузера.':''}`)})}
 return <div className="notification-settings"><section aria-label="Реальные уведомления"><h3>Уведомления о новых записях и изменениях</h3>
 <p>Источник содержит опубликованные записи, полнота расписания дня не гарантируется. Исчезновение записи не означает отмену занятия.</p>
 <p role="status">{pending?'Удаление подписки на сервере ожидает подтверждения.':!c?'Состояние подписки не проверено.':c.device?.active?`Подписка на сервере подключена для группы ${c.device.group}.`:'Активной подписки на сервере нет.'}</p>
 {c&&<p>{!c.sendingStatusKnown?'Состояние автоматической доставки не удалось проверить.':c.realEnabled&&c.sendingEnabled?'Автоматическая доставка включена.':'Автоматическая доставка временно приостановлена.'}</p>}
 {c&&!c.registrationAllowed&&<p>Подключение и изменение настроек временно недоступны. Отписаться можно в любой момент.</p>}
 <label><input type="checkbox" checked={changes} onChange={e=>setChanges(e.target.checked)}/> Изменения уже опубликованных дат</label><br/>
 <label><input type="checkbox" checked={publications} onChange={e=>setPublications(e.target.checked)}/> Первое появление записей на новые даты</label>
 <p>Максимум одно сводное уведомление за одну проверку, только на сегодня и будущие даты. Старые события при подключении не отправляются. Уведомления не содержат ФИО. Проверка раз в 15 минут не гарантирует точное время доставки.</p>
 <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Я согласен получать выбранные уведомления на этом устройстве</label>
 <button className="button full-width" disabled={busy||pending||!c?.registrationAllowed||!consent||!(changes||publications)||!!(c.device?.active&&c.device.group!==group)} onClick={enable}>{c?.device?.active?'Сохранить настройки уведомлений':'Включить выбранные уведомления'}</button>
 {c?.device?.active&&c.device.group!==group&&<button className="button full-width" disabled={busy||pending} onClick={switchGroup}>Переключить уведомления на группу {group}</button>}
 <button className="button full-width" disabled={busy} onClick={disable}>Отключить уведомления и удалить подписку</button>
 <button className="button full-width" disabled={busy} aria-busy={busy} onClick={check}>Проверить состояние подписки</button>
 <button className="button full-width" disabled={busy||pending||!c?.device?.active} onClick={verifyDevice}>Получить код сверки устройства</button>
 {verificationCode&&<p role="status">Код для одной сверки (можно передать в чат): <strong>{verificationCode}</strong></p>}
 <p>Адрес и ключи push-подписки хранятся на сервере в закрытой базе данных. При отписке они удаляются с сервера.</p>
 {warning&&<p role="alert">{warning}</p>}<p role="status" aria-live="polite">{message}</p></section><InstallGuide/></div>;
}
