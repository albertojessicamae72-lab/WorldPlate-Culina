export const COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", currencySymbol: "₱" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", currencySymbol: "€" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", currencySymbol: "$" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", currencySymbol: "د.إ" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", currencySymbol: "$" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", currencySymbol: "₩" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", currencySymbol: "€" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", currencySymbol: "£" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", currencySymbol: "$" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", currencySymbol: "฿" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", currencySymbol: "$" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", currency: "EGP", currencySymbol: "E£" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", currencySymbol: "₹" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", currency: "TRY", currencySymbol: "₺" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND", currencySymbol: "₫" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", currencySymbol: "€" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", currencySymbol: "﷼" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", currencySymbol: "€" },
];

export const getCountry = (/** @type {string} */ code) => COUNTRIES.find((c) => c.code === code);