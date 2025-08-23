import React from 'react'
import { Zap, Plus } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useCreditBalance } from '../../hooks/useCreditBalance'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n'

export function CreditBalance() {
  const { user } = useAuth()
  const { balance, loading } = useCreditBalance()
  const { t, isRTL } = useTranslation()
  const navigate = useNavigate()

  if (!user) return null

  if (loading) {
    return (
      <div className={`flex items-center text-gray-400 ${isRTL() ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
        <Zap className="h-4 w-4" />
        <span className="text-sm">{t('credit.loading')}</span>
      </div>
    )
  }

  const isLowBalance = balance < 50

  return (
    <div className={`flex items-center relative group ${isRTL() ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
      <Zap className={`h-4 w-4 ${isLowBalance ? 'text-yellow-500' : 'text-cyan-400'}`} />
      <span className={`text-sm font-medium ${isLowBalance ? 'text-yellow-500' : 'text-white'}`}>
        {balance.toLocaleString()} {t('credit.balance')}
      </span>
      <button
        onClick={() => navigate('/pricing')}
        className={`p-1 hover:bg-white/10 rounded-full transition-colors ${isRTL() ? 'mr-2' : 'ml-2'}`}
        title={t('credit.buy_more')}
      >
        <Plus className="h-4 w-4 text-cyan-400" />
      </button>
    </div>
  )
}