'use client';
import {useEffect} from 'react';
import {staticPath} from '../src/ui/static-path';
export default function StageOneNotice(){useEffect(()=>{if('serviceWorker' in navigator)void navigator.serviceWorker.register(staticPath('/sw.js'),{scope:staticPath('/'),updateViaCache:'none'}).catch(()=>{});},[]);return <aside className="stage-one-notice" aria-label="Промежуточный этап Pages"><strong>Тест Pages · уведомления не подключены</strong><p>Готовые расписание и журнал обеих групп публикуются из существующего Worker. Браузер не обращается к Deno. Уведомления на этом адресе пока не подключены; рабочая Deno-копия не изменена.</p></aside>}
