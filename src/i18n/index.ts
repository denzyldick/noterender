import Vue from "vue";
import VueI18n from "vue-i18n";
import en from "./locales/en";
import fr from "./locales/fr";
import es from "./locales/es";
import nl from "./locales/nl";
import pap from "./locales/pap";
import de from "./locales/de";
import pt from "./locales/pt";
import it from "./locales/it";

Vue.use(VueI18n);

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "nl", label: "Nederlands" },
  { code: "pap", label: "Papiamentu" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
];

const LOCALE_KEY = "noterender_locale";

function detectLocale(): string {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("lang");
  if (fromUrl && SUPPORTED_LOCALES.some((l) => l.code === fromUrl)) return fromUrl;

  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) return saved;

  const nav = window.navigator.language || "en";
  const base = nav.split("-")[0].toLowerCase();
  if (SUPPORTED_LOCALES.some((l) => l.code === base)) return base;
  return "en";
}

export const i18n = new VueI18n({
  locale: detectLocale(),
  fallbackLocale: "en",
  messages: { en, fr, es, nl, pap, de, pt, it },
});

export function setLocale(code: string): void {
  if (!SUPPORTED_LOCALES.some((l) => l.code === code)) return;
  i18n.locale = code;
  localStorage.setItem(LOCALE_KEY, code);
  document.documentElement.lang = code;
}

setLocale(i18n.locale as string);