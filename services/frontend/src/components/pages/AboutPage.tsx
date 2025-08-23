import React from 'react'
import { useTranslation } from '../../lib/i18n'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="py-20 px-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">{t('nav.about')}</h1>
      <p className="text-gray-400 max-w-2xl mx-auto">
        {t('company.description')}
      </p>
    </div>
  )
}