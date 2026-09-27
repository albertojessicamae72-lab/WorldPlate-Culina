export const CUISINES = [
  { code: "filipino", name: "Filipino", country: "PH", flag: "🇵🇭" },
  { code: "japanese", name: "Japanese", country: "JP", flag: "🇯🇵" },
  { code: "italian", name: "Italian", country: "IT", flag: "🇮🇹" },
  { code: "egyptian", name: "Egyptian", country: "EG", flag: "🇪🇬" },
  { code: "korean", name: "Korean", country: "KR", flag: "🇰🇷" },
  { code: "chinese", name: "Chinese", country: "CN", flag: "🇨🇳" },
  { code: "thai", name: "Thai", country: "TH", flag: "🇹🇭" },
  { code: "indian", name: "Indian", country: "IN", flag: "🇮🇳" },
  { code: "mexican", name: "Mexican", country: "MX", flag: "🇲🇽" },
  { code: "french", name: "French", country: "FR", flag: "🇫🇷" },
  { code: "emirati", name: "Emirati", country: "AE", flag: "🇦🇪" },
  { code: "turkish", name: "Turkish", country: "TR", flag: "🇹🇷" },
];

/**
 * @param {string} code
 */
export const getCuisine = (code) => CUISINES.find((c) => c.code === code);