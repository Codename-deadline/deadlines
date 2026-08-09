import en from "./en.json";
import ru from "./ru.json";

export enum Locale {
  EN = "en",
  RU = "ru",
}

const translations: { readonly [key in Locale]: typeof en } = {
  [Locale.EN]: en,
  [Locale.RU]: ru,
};

export const fallbackLocale: Locale = Locale.EN;

export const getTranslation = (locale: Locale): typeof en => {
  return translations[locale];
};
