'use client';
import InstallGuide from './install-guide';
export default function PushSettings({open,group}:{group:string;open:boolean}){return <div className="notification-settings"><h3>Уведомления — следующий этап</h3><p role="status">В этой статической сборке подключение, переключение и отключение подписки ещё не реализованы. Настоящие уведомления не включаются и разрешение браузера не запрашивается.</p><p>Выбрана группа {group||'…'}. Это промежуточная версия интерфейса, а не отказ от уведомлений. Установленная Deno-копия и её настройки не меняются.</p><InstallGuide/></div>}
