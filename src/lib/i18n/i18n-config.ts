export const i18nConfig = {
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "as-needed", // não mostra prefixo para pt
} as const;

export type Locale = (typeof i18nConfig)["locales"][number];
