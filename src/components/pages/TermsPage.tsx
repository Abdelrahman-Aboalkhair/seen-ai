import React from 'react'
import { useTranslation } from '../../lib/i18n'

export function TermsPage() {
  const { t, language } = useTranslation()

  const termsContent = {
    ar: {
      title: 'شروط الخدمة',
      content: 'باستخدام هذه المنصة، فإنك توافق على الالتزام بهذه الشروط. يرجى قراءتها بعناية.'
    },
    en: {
      title: 'Terms of Service',
      content: 'By using this platform, you agree to comply with these terms. Please read them carefully.'
    }
  }

  const content = termsContent[language]

  return (
    <div className="py-20 px-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">{content.title}</h1>
      <p className="text-gray-400 max-w-2xl mx-auto">
        {content.content}
      </p>
    </div>
  )
}