import { createContext, useContext, useState } from "react";

/**
 * @typedef {Object} AppContextValue
 * @property {string} cookingCountry
 * @property {(country: string) => void} setCookingCountry
 * @property {string} language
 * @property {(language: string) => void} setLanguage
 */

/** @type {import("react").Context<AppContextValue | null>} */
const AppContext = createContext(/** @type {AppContextValue | null} */ (null));

/** @param {{ children?: import("react").ReactNode }} props */
export function AppProvider({ children }) {
  const [cookingCountry, setCookingCountryState] = useState(
    () => localStorage.getItem("cookingCountry") || "PH"
  );
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("appLanguage") || "en"
  );

  /** @param {string} c */
  const setCookingCountry = (c) => {
    setCookingCountryState(c);
    localStorage.setItem("cookingCountry", c);
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