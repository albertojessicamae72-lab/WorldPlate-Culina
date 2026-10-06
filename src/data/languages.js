export const LANGUAGES = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fil", name: "Filipino", flag: "🇵🇭" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "ar", name: "العربية (مصر)", flag: "🇪🇬" },
    { code: "th", name: "ไทย", flag: "🇹🇭" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es-MX", name: "Español (México)", flag: "🇲🇽" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

export const getLanguange = (code) => LANGUAGES.find((language) => language.code === code);
export const getLanguage = (code) => LANGUAGES.find((l) => l.code === code);
