'use client';
import {useState, type KeyboardEvent} from 'react';
export default function InstallGuide(){
 const [platform,setPlatform]=useState<'iphone'|'android'>('iphone');
 function moveTab(e:KeyboardEvent<HTMLButtonElement>){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  const next=e.key==='Home'?'iphone':e.key==='End'?'android':platform==='iphone'?'android':'iphone';
  setPlatform(next);document.getElementById(`install-tab-${next}`)?.focus();
 }
 return <details className="install-guide">
  <summary>Как установить на телефон</summary>
  <p className="install-order">Можно установить приложение на экран телефона. Уведомления включаются только по вашему нажатию.</p>
  <div className="install-tabs" role="tablist" aria-label="Инструкция для телефона">
   {(['iphone','android'] as const).map(p=><button key={p} type="button" role="tab" id={`install-tab-${p}`} aria-controls={`install-panel-${p}`} aria-selected={platform===p} tabIndex={platform===p?0:-1} onKeyDown={moveTab} onClick={()=>setPlatform(p)}>{p==='iphone'?'iPhone':'Android'}</button>)}
  </div>
  <div role="tabpanel" id="install-panel-iphone" aria-labelledby="install-tab-iphone" hidden={platform!=='iphone'}>
   <ol>
    <li>Откройте этот сайт в <strong>Safari</strong>, не во встроенном браузере Telegram.</li>
    <li>Нажмите <strong>«Поделиться» → «На экран Домой» → «Добавить»</strong>. Если предлагается «Открывать как веб-приложение», оставьте включённым.</li>
    <li>Откройте <strong>zameny со значка на экране Домой</strong>.</li>
    <li>После отдельного согласования откройте настройки уведомлений, выберите события, отметьте согласие и нажмите «Включить выбранные уведомления».</li>
   </ol>
   <p>Для уведомлений нужна iOS / iPadOS 16.4 или новее. Уже установленное приложение удалять не нужно.</p>
  </div>
  <div role="tabpanel" id="install-panel-android" aria-labelledby="install-tab-android" hidden={platform!=='android'}>
   <ol>
    <li>Откройте этот сайт в <strong>Chrome</strong>, не во встроенном браузере Telegram.</li>
    <li>Нажмите <strong>меню Chrome (три точки) → «Добавить на главный экран»</strong> или <strong>«Установить приложение»</strong> и подтвердите. Название пункта зависит от версии браузера.</li>
    <li>Откройте zameny со значка на главном экране.</li>
    <li>В настройках уведомлений выберите события, отметьте согласие и нажмите «Включить выбранные уведомления».</li>
   </ol>
   <p>В поддерживаемом браузере Android уведомления можно включить и без установки.</p>
  </div>
  <p>Установка сама по себе не включает уведомления.</p>
 </details>;
}
