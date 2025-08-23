import React from 'react'
import { useTranslation } from '../../lib/i18n'

export function ContactPage() {
  const { t } = useTranslation()

  return (
    <div className="py-20 px-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">{t('contact.title')}</h1>
      <p className="text-gray-400 mb-8">{t('contact.subtitle')}</p>
      <div className="max-w-md mx-auto space-y-4">
        <p className="text-white">
          <strong>{t('form.email')}:</strong> {t('contact.email')}
        </p>
        <p className="text-white">
          <strong>الهاتف / Phone:</strong> {t('contact.phone')}
        </p>
      </div>
    </div>
  )
}