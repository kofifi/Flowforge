import { useCallback, useEffect, useState } from 'react'

type Language = 'en' | 'pl'

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('flowforge-language')
  return stored === 'pl' ? 'pl' : 'en'
}

export function useLanguagePreference() {
  const [language, setLanguage] = useState<Language>(getStoredLanguage)

  useEffect(() => {
    localStorage.setItem('flowforge-language', language)
  }, [language])

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'pl' : 'en'))
  }, [])

  return { language, setLanguage, toggleLanguage }
}
