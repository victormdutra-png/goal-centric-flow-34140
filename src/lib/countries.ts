export type Country = {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  phoneFormat: string;
  phonePlaceholder: string;
  dateFormat: string;
  datePlaceholder: string;
  language: string;
};

export const countries: Country[] = [
  // Americas
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54", phoneFormat: "XX XXXX-XXXX", phonePlaceholder: "11 1234-5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", phoneCode: "+55", phoneFormat: "(XX) XXXXX-XXXX", phonePlaceholder: "(11) 99999-9999", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "pt-BR" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1", phoneFormat: "(XXX) XXX-XXXX", phonePlaceholder: "(416) 555-5555", dateFormat: "MM/DD/YYYY", datePlaceholder: "MM/DD/YYYY", language: "en-US" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56", phoneFormat: "X XXXX XXXX", phonePlaceholder: "9 1234 5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "321 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "MX", name: "México", flag: "🇲🇽", phoneCode: "+52", phoneFormat: "XX XXXX XXXX", phonePlaceholder: "55 1234 5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "PE", name: "Perú", flag: "🇵🇪", phoneCode: "+51", phoneFormat: "XXX XXX XXX", phonePlaceholder: "987 654 321", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1", phoneFormat: "(XXX) XXX-XXXX", phonePlaceholder: "(555) 555-5555", dateFormat: "MM/DD/YYYY", datePlaceholder: "MM/DD/YYYY", language: "en-US" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", phoneCode: "+598", phoneFormat: "XX XXX XXX", phonePlaceholder: "91 234 567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phoneCode: "+58", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "412 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  
  // Europe
  { code: "AT", name: "Österreich", flag: "🇦🇹", phoneCode: "+43", phoneFormat: "XXX XXXXXXX", phonePlaceholder: "664 1234567", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.JJJJ", language: "de-DE" },
  { code: "BE", name: "België", flag: "🇧🇪", phoneCode: "+32", phoneFormat: "XXX XX XX XX", phonePlaceholder: "470 12 34 56", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/JJJJ", language: "fr-FR" },
  { code: "CH", name: "Schweiz", flag: "🇨🇭", phoneCode: "+41", phoneFormat: "XX XXX XX XX", phonePlaceholder: "78 123 45 67", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.JJJJ", language: "de-DE" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", phoneCode: "+49", phoneFormat: "XXX XXXXXXXX", phonePlaceholder: "151 12345678", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.JJJJ", language: "de-DE" },
  { code: "DK", name: "Danmark", flag: "🇩🇰", phoneCode: "+45", phoneFormat: "XX XX XX XX", phonePlaceholder: "20 12 34 56", dateFormat: "DD-MM-YYYY", datePlaceholder: "DD-MM-ÅÅÅÅ", language: "en-US" },
  { code: "ES", name: "España", flag: "🇪🇸", phoneCode: "+34", phoneFormat: "XXX XXX XXX", phonePlaceholder: "612 345 678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "es-ES" },
  { code: "FI", name: "Suomi", flag: "🇫🇮", phoneCode: "+358", phoneFormat: "XX XXX XXXX", phonePlaceholder: "40 123 4567", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.VVVV", language: "en-US" },
  { code: "FR", name: "France", flag: "🇫🇷", phoneCode: "+33", phoneFormat: "X XX XX XX XX", phonePlaceholder: "6 12 34 56 78", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "fr-FR" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44", phoneFormat: "XXXX XXX XXXX", phonePlaceholder: "7400 123 456", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "GR", name: "Ελλάδα", flag: "🇬🇷", phoneCode: "+30", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "691 234 5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "ΗΗ/ΜΜ/ΕΕΕΕ", language: "en-US" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", phoneCode: "+353", phoneFormat: "XX XXX XXXX", phonePlaceholder: "85 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "IT", name: "Italia", flag: "🇮🇹", phoneCode: "+39", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "320 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "it-IT" },
  { code: "NL", name: "Nederland", flag: "🇳🇱", phoneCode: "+31", phoneFormat: "X XX XX XX XX", phonePlaceholder: "6 12 34 56 78", dateFormat: "DD-MM-YYYY", datePlaceholder: "DD-MM-JJJJ", language: "en-US" },
  { code: "NO", name: "Norge", flag: "🇳🇴", phoneCode: "+47", phoneFormat: "XXX XX XXX", phonePlaceholder: "406 12 345", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.ÅÅÅÅ", language: "en-US" },
  { code: "PL", name: "Polska", flag: "🇵🇱", phoneCode: "+48", phoneFormat: "XXX XXX XXX", phonePlaceholder: "512 345 678", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.RRRR", language: "en-US" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phoneCode: "+351", phoneFormat: "XXX XXX XXX", phonePlaceholder: "912 345 678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/AAAA", language: "pt-BR" },
  { code: "RU", name: "Россия", flag: "🇷🇺", phoneCode: "+7", phoneFormat: "XXX XXX-XX-XX", phonePlaceholder: "912 345-67-89", dateFormat: "DD.MM.YYYY", datePlaceholder: "ДД.ММ.ГГГГ", language: "ru-RU" },
  { code: "SE", name: "Sverige", flag: "🇸🇪", phoneCode: "+46", phoneFormat: "XX XXX XX XX", phonePlaceholder: "70 123 45 67", dateFormat: "YYYY-MM-DD", datePlaceholder: "ÅÅÅÅ-MM-DD", language: "en-US" },
  { code: "TR", name: "Türkiye", flag: "🇹🇷", phoneCode: "+90", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "532 123 4567", dateFormat: "DD.MM.YYYY", datePlaceholder: "DD.MM.YYYY", language: "en-US" },
  { code: "UA", name: "Україна", flag: "🇺🇦", phoneCode: "+380", phoneFormat: "XX XXX XX XX", phonePlaceholder: "50 123 45 67", dateFormat: "DD.MM.YYYY", datePlaceholder: "ДД.ММ.РРРР", language: "en-US" },
  
  // Asia
  { code: "AE", name: "الإمارات", flag: "🇦🇪", phoneCode: "+971", phoneFormat: "XX XXX XXXX", phonePlaceholder: "50 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "CN", name: "中国", flag: "🇨🇳", phoneCode: "+86", phoneFormat: "XXX XXXX XXXX", phonePlaceholder: "138 0013 8000", dateFormat: "YYYY-MM-DD", datePlaceholder: "YYYY-MM-DD", language: "zh-CN" },
  { code: "HK", name: "香港", flag: "🇭🇰", phoneCode: "+852", phoneFormat: "XXXX XXXX", phonePlaceholder: "5123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "zh-CN" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", phoneCode: "+62", phoneFormat: "XXX-XXXX-XXXX", phonePlaceholder: "812-3456-7890", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "IL", name: "ישראל", flag: "🇮🇱", phoneCode: "+972", phoneFormat: "XX-XXX-XXXX", phonePlaceholder: "50-123-4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91", phoneFormat: "XXXXX XXXXX", phonePlaceholder: "98765 43210", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "JP", name: "日本", flag: "🇯🇵", phoneCode: "+81", phoneFormat: "XX-XXXX-XXXX", phonePlaceholder: "90-1234-5678", dateFormat: "YYYY/MM/DD", datePlaceholder: "YYYY/MM/DD", language: "ja-JP" },
  { code: "KR", name: "대한민국", flag: "🇰🇷", phoneCode: "+82", phoneFormat: "XX-XXXX-XXXX", phonePlaceholder: "10-1234-5678", dateFormat: "YYYY-MM-DD", datePlaceholder: "YYYY-MM-DD", language: "ko-KR" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", phoneCode: "+60", phoneFormat: "XX-XXXX XXXX", phonePlaceholder: "12-3456 7890", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", phoneCode: "+63", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "917 123 4567", dateFormat: "MM/DD/YYYY", datePlaceholder: "MM/DD/YYYY", language: "en-US" },
  { code: "SA", name: "السعودية", flag: "🇸🇦", phoneCode: "+966", phoneFormat: "XX XXX XXXX", phonePlaceholder: "50 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", phoneCode: "+65", phoneFormat: "XXXX XXXX", phonePlaceholder: "8123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "TH", name: "ไทย", flag: "🇹🇭", phoneCode: "+66", phoneFormat: "XX XXX XXXX", phonePlaceholder: "81 234 5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "TW", name: "台灣", flag: "🇹🇼", phoneCode: "+886", phoneFormat: "XXXX XXX XXX", phonePlaceholder: "0912 345 678", dateFormat: "YYYY/MM/DD", datePlaceholder: "YYYY/MM/DD", language: "zh-CN" },
  { code: "VN", name: "Việt Nam", flag: "🇻🇳", phoneCode: "+84", phoneFormat: "XX XXXX XXXX", phonePlaceholder: "91 234 5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  
  // Africa
  { code: "EG", name: "مصر", flag: "🇪🇬", phoneCode: "+20", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "100 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", phoneCode: "+254", phoneFormat: "XXX XXX XXX", phonePlaceholder: "712 345 678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "MA", name: "المغرب", flag: "🇲🇦", phoneCode: "+212", phoneFormat: "XX-XXXX-XXXX", phonePlaceholder: "06-1234-5678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "fr-FR" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", phoneCode: "+234", phoneFormat: "XXX XXX XXXX", phonePlaceholder: "802 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", phoneCode: "+27", phoneFormat: "XX XXX XXXX", phonePlaceholder: "82 123 4567", dateFormat: "YYYY/MM/DD", datePlaceholder: "YYYY/MM/DD", language: "en-US" },
  
  // Oceania
  { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61", phoneFormat: "XXX XXX XXX", phonePlaceholder: "412 345 678", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", phoneCode: "+64", phoneFormat: "XX XXX XXXX", phonePlaceholder: "21 123 4567", dateFormat: "DD/MM/YYYY", datePlaceholder: "DD/MM/YYYY", language: "en-US" },
];
