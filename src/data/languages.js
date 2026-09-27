export const LANGUAGES = [
    {code: "en", name: "English", flag: "🇺🇸"},
    {code: "fil", name: "Filipino", flag: "🇵🇭"},
    {code: "es", name: "Spanish", flag: "🇪🇸"},
    {code: "ja", name: "Japanese", flag: "🇯🇵"},
    {code: "ko", name: "Korean", flag: "🇰🇷"},
    {code: "it", name: "Italian", flag: "🇮🇹"},
    {code: "fr", name: "French", flag: "🇫🇷"},
    {code: "de", name: "German", flag: "🇩🇪"},
    {code: "ar", name: "Arabic", flag: "🇸🇦"},
    {code: "th", name: "Thai", flag: "🇹🇭"},
    {code: "vi", name: "Vietnamese", flag: "🇻🇳"},
];

export const getLanguange = (code) => LANGUAGES.find((language) => language.code === code);
export const getLanguage = (code) => LANGUAGES.find((l) => l.code === code);