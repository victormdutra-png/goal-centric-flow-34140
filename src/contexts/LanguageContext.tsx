import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, translate } from "@/lib/i18n";
import { countries } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  detectedCountryCode: string | null;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt-BR',
  setLanguage: () => {},
  t: (key: string) => key,
  detectedCountryCode: null,
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

// Map country codes to language codes
const countryToLanguageMap: Record<string, Language> = {
  'BR': 'pt-BR',
  'US': 'en-US',
  'GB': 'en-US',
  'ES': 'es-ES',
  'MX': 'es-ES',
  'AR': 'es-ES',
  'FR': 'fr-FR',
  'DE': 'de-DE',
  'IT': 'it-IT',
  'JP': 'ja-JP',
  'CN': 'zh-CN',
  'KR': 'ko-KR',
  'RU': 'ru-RU',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const { user, profile } = useAuth();

  // Load language from user profile or detect location
  useEffect(() => {
    const detectLocation = async () => {
      // If user is logged in and has a language preference, use it
      if (profile?.language) {
        setLanguage(profile.language as Language);
        localStorage.setItem('app-language', profile.language);
        return;
      }

      // Check if language is already saved in localStorage
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage) {
        setLanguage(savedLanguage);
        return;
      }

      // Try to detect location using geolocation API
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });

          // Use a geocoding API to get country from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.countryCode;
            setDetectedCountryCode(countryCode);

            // Find language for this country
            const detectedLanguage = countryToLanguageMap[countryCode] || 'pt-BR';
            setLanguage(detectedLanguage);
            localStorage.setItem('app-language', detectedLanguage);
            
            // Save to profile if user is logged in
            if (user?.id) {
              await supabase
                .from('profiles')
                .update({ language: detectedLanguage })
                .eq('id', user.id);
            }
            return;
          }
        } catch (error) {
          console.log('Geolocation not available or denied');
        }
      }

      // Fallback: try to detect from browser language
      const browserLang = navigator.language;
      const matchedLanguage = Object.keys(countryToLanguageMap).find(
        key => browserLang.startsWith(key.toLowerCase())
      );
      
      if (matchedLanguage) {
        const detectedLanguage = countryToLanguageMap[matchedLanguage] || 'pt-BR';
        setLanguage(detectedLanguage);
        localStorage.setItem('app-language', detectedLanguage);
      }
    };

    detectLocation();
  }, [user, profile]);

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
    
    // Save to user profile if logged in
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id);
    }
  };

  const t = (key: string) => translate(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, detectedCountryCode }}>
      {children}
    </LanguageContext.Provider>
  );
};
