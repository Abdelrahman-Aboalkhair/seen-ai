import React, { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation, Language } from '../../lib/i18n'

export function LanguageSwitcher() {
  const { language, changeLanguage, isRTL } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (langCode: Language) => {
    changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-600/50 hover:border-slate-500"
        title="تغيير اللغة / Change Language"
      >
        <Globe className="h-4 w-4 text-cyan-400" />
        <span className="text-sm text-white font-medium hidden sm:inline">
          {currentLanguage?.nativeName}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 ${
            isRTL() ? 'right-0' : 'left-0'
          }`}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language === lang.code ? 'bg-slate-700 text-cyan-400' : 'text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-sm text-gray-400">{lang.name}</div>
                  </div>
                  {language === lang.code && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}