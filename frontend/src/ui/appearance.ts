// Appearance only: no server state or subscription settings.
export const APPEARANCE_KEY = "zameny.appearance.v1";
export const APPEARANCES = [
  {
    "id": "white",
    "label": "Белый",
    "accent": "#ffffff",
    "surface": "#000000",
    "soft": "#0c0c0c",
    "active": "#1a1a1a"
  },
  {
    "id": "purple",
    "label": "Фиолетовый",
    "accent": "#b792f5",
    "surface": "#100b19",
    "soft": "#191124",
    "active": "#2b1d40"
  },
  {
    "id": "green",
    "label": "Зелёный",
    "accent": "#6bd79d",
    "surface": "#09150f",
    "soft": "#0e2117",
    "active": "#183a28"
  },
  {
    "id": "red",
    "label": "Красный",
    "accent": "#f38b8e",
    "surface": "#190b0d",
    "soft": "#261215",
    "active": "#401f24"
  },
  {
    "id": "blue",
    "label": "Синий",
    "accent": "#7eabff",
    "surface": "#0a111e",
    "soft": "#111f34",
    "active": "#1c3151"
  },
  {
    "id": "cyan",
    "label": "Голубой",
    "accent": "#6cdaea",
    "surface": "#08161a",
    "soft": "#0d2229",
    "active": "#163940"
  },
  {
    "id": "pink",
    "label": "Розовый",
    "accent": "#f49acb",
    "surface": "#190d16",
    "soft": "#271622",
    "active": "#402237"
  },
  {
    "id": "orange",
    "label": "Оранжевый",
    "accent": "#f0af71",
    "surface": "#180f09",
    "soft": "#271b10",
    "active": "#402c1a"
  }
] as const;
export type Appearance = (typeof APPEARANCES)[number]["id"];
export function appearance(value: unknown): Appearance {
  return APPEARANCES.some((item) => item.id === value) ? value as Appearance : "white";
}
// Brightness is independent of the existing accent preference.
export const COLOR_MODE_KEY = "zameny.color-mode.v1";
export type ColorMode = "dark" | "light";
export function colorMode(value: unknown): ColorMode { return value === "dark" ? "dark" : "light"; }
export const LIGHT_APPEARANCES = [
  {id:"white",accent:"#262626",surface:"#ffffff",soft:"#f7f7f7",active:"#eaeaea"},
  {id:"purple",accent:"#7047a8",surface:"#fcfaff",soft:"#f5effc",active:"#e8dcf6"},
  {id:"green",accent:"#217347",surface:"#f8fcfa",soft:"#edf7f0",active:"#d9eddf"},
  {id:"red",accent:"#b73542",surface:"#fffafa",soft:"#fceff0",active:"#f6dde0"},
  {id:"blue",accent:"#245caa",surface:"#f9fbff",soft:"#edf3fc",active:"#dae6f8"},
  {id:"cyan",accent:"#146b7c",surface:"#f8fcfd",soft:"#edf7f9",active:"#d8edf1"},
  {id:"pink",accent:"#a42e73",surface:"#fffafd",soft:"#fceff7",active:"#f4ddeb"},
  {id:"orange",accent:"#99521a",surface:"#fffcf8",soft:"#fcf3e9",active:"#f3e3cf"}
] as const;
export function applyColorMode(value: ColorMode) {
 document.documentElement.dataset.mode=value;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='light'?'#ffffff':'#000000');
 document.querySelector('meta[name="color-scheme"]')?.setAttribute('content',value);
}
// Runs before paint. Each preference fails independently if storage is blocked.
export const appearanceBootstrap = `try{var a=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)});document.documentElement.dataset.accent=${JSON.stringify(APPEARANCES.map(p=>p.id))}.includes(a)?a:"white"}catch{document.documentElement.dataset.accent="white"}try{document.documentElement.dataset.mode=localStorage.getItem(${JSON.stringify(COLOR_MODE_KEY)})==="dark"?"dark":"light"}catch{document.documentElement.dataset.mode="light"}`;
