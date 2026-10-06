import { createContext, useContext, useEffect, useState } from "react";

/**
 * @typedef {Object} AppContextValue
 * @property {string} cookingCountry
 * @property {(country: string) => void} setCookingCountry
 * @property {string} language
 * @property {(language: string) => void} setLanguage
 */

/** @type {import("react").Context<AppContextValue | null>} */
const AppContext = createContext(/** @type {AppContextValue | null} */ (null));

const COUNTRY_LANGUAGES = {
  PH: "fil", JP: "ja", IT: "it", US: "en", AE: "ar", CA: "en", KR: "ko",
  FR: "fr", GB: "en", SG: "en", TH: "th", MX: "es-MX", EG: "ar", IN: "hi",
  TR: "tr", VN: "en", DE: "en", SA: "ar", CN: "zh", ES: "es-MX",
};

export const languageForCountry = (country) => COUNTRY_LANGUAGES[country] || "en";

/** @param {{ children?: import("react").ReactNode }} props */
export function AppProvider({ children }) {
  const [cookingCountry, setCookingCountryState] = useState(
    () => localStorage.getItem("cookingCountry") || "PH"
  );
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("appLanguage") || languageForCountry(localStorage.getItem("cookingCountry") || "PH")
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  /** @param {string} c */
  const setCookingCountry = (c) => {
    setCookingCountryState(c);
    localStorage.setItem("cookingCountry", c);
    const nextLanguage = languageForCountry(c);
    setLanguageState(nextLanguage);
    localStorage.setItem("appLanguage", nextLanguage);
  };
  /** @param {string} l */
  const setLanguage = (l) => {
    setLanguageState(l);
    localStorage.setItem("appLanguage", l);
  };

  return (
    <AppContext.Provider
      value={{ cookingCountry, setCookingCountry, language, setLanguage }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
