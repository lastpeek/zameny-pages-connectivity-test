'use client';
import {useEffect} from 'react';
import {staticPath} from '../src/ui/static-path';
export default function StageOneNotice(){useEffect(()=>{if('serviceWorker' in navigator)void navigator.serviceWorker.register(staticPath('/sw.js'),{scope:staticPath('/'),updateViaCache:'none'}).catch(()=>{});},[]);return <aside className="stage-one-notice" aria-label="Промежуточный этап Pages"><strong>Тест Pages · уведомления в проверке</strong><p>Расписание и журнал обеих групп публикуются из существующего Worker. Настройка уведомлений использует отдельный API; доставка в этой копии ещё не проверена на устройстве. Рабочая Deno-копия не изменена.</p></aside>}
