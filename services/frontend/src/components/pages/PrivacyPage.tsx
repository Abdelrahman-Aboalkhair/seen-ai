import React from 'react'
import { useTranslation } from '../../lib/i18n'

export function PrivacyPage() {
  const { t, language } = useTranslation()

  const privacyContent = {
    ar: {
      title: 'سياسة الخصوصية',
      content: 'نحن نهتم بحماية بياناتك الشخصية وضمان أمانها. جميع البيانات محمية بأعلى معايير الأمان.'
    },
    en: {
      title: 'Privacy Policy',
      content: 'We care about protecting your personal data and ensuring its security. All data is protected with the highest security standards.'
    }
  }

  const content = privacyContent[language]

  return (
    <div className="py-20 px-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">{content.title}</h1>
      <p className="text-gray-400 max-w-2xl mx-auto">
        {content.content}
      </p>
    </div>
  )
}