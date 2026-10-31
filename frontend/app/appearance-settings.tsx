"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { APPEARANCES, APPEARANCE_KEY, appearance, COLOR_MODE_KEY, colorMode, applyColorMode, LIGHT_APPEARANCES, type ColorMode, type Appearance } from "../src/ui/appearance";

export default function AppearanceSettings() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<Appearance>("white");
  const [mode, setMode] = useState<ColorMode>("light");
  const [storageNotice, setStorageNotice] = useState("");
  useEffect(() => { setSelected(appearance(document.documentElement.dataset.accent)); const restored=colorMode(document.documentElement.dataset.mode);setMode(restored);applyColorMode(restored); }, []);
  function chooseMode(value: ColorMode) {
    applyColorMode(value);setMode(value);
    try { localStorage.setItem(COLOR_MODE_KEY,value);setStorageNotice(""); }
    catch {setStorageNotice("Сохранение недоступно. Оформление действует до закрытия страницы.");}
  }
  function choose(id: Appearance) {
    document.documentElement.dataset.accent = id;
    setSelected(id);
    try { localStorage.setItem(APPEARANCE_KEY, id); setStorageNotice(""); }
    catch { setStorageNotice("Сохранение недоступно. Оформление действует до закрытия страницы."); }
  }
  function close() { dialog.current?.close(); trigger.current?.focus(); }
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <>
    <button ref={trigger} type="button" className="button button-quiet appearance-trigger" aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); dialog.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(); }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
      <span>Оформление</span>
    </button>
    <dialog ref={dialog} className="dialog appearance-dialog" aria-labelledby="appearance-title" aria-describedby="appearance-description" onKeyDown={keys}>
      <div className="dialog-top"><div><p className="eyebrow">ВАШ СТИЛЬ</p><h2 id="appearance-title">Оформление</h2></div><button type="button" className="icon-button" aria-label="Закрыть оформление" onClick={close}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <p className="dialog-description" id="appearance-description">Выберите светлую или тёмную тему и цвет акцента.</p>
      <div className="color-mode-options" role="radiogroup" aria-label="Светлая или тёмная тема" onKeyDown={event=>{
        if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
        event.preventDefault();const next=event.key==="Home"?"dark":event.key==="End"?"light":mode==="dark"?"light":"dark";chooseMode(next);event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus();
      }}>
        {(["dark","light"] as const).map(value=><button type="button" key={value} data-value={value} role="radio" aria-checked={mode===value} tabIndex={mode===value?0:-1} onClick={()=>chooseMode(value)}><span>{value==="dark"?"Тёмная":"Светлая"}</span><span aria-hidden="true">{mode===value?"✓":""}</span></button>)}
      </div>
      <h3 className="appearance-section-title">Акцентный цвет</h3>
      <div className="appearance-grid" role="radiogroup" aria-label="Акцентный цвет" onKeyDown={(event) => {
        const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (!(event.key in moves) && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const current = APPEARANCES.findIndex(p => p.id === selected);
        const index = event.key === "Home" ? 0 : event.key === "End" ? APPEARANCES.length - 1 : (current + moves[event.key] + APPEARANCES.length) % APPEARANCES.length;
        choose(APPEARANCES[index].id);
        event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[index]?.focus();
      }}>
        {APPEARANCES.map(p => <button key={p.id} type="button" className="appearance-option" role="radio" aria-checked={selected === p.id} tabIndex={selected === p.id ? 0 : -1} onClick={() => choose(p.id)}>
          <span className="appearance-swatch" style={{ backgroundColor: mode === "light" ? LIGHT_APPEARANCES.find(a=>a.id===p.id)!.accent : p.accent }} aria-hidden="true"/><span>{mode === "light" && p.id === "white" ? "Чёрный" : p.label}</span><span className="appearance-check" aria-hidden="true">{selected === p.id ? "✓" : ""}</span>
        </button>)}
      </div>
      <p className="dialog-footnote" role="status">{storageNotice || "Применяется сразу. Выбор хранится только на этом устройстве."}</p>
    </dialog>
  </>;
}
