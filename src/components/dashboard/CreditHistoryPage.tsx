import React, { useState, useEffect } from 'react'
import { Zap, TrendingUp, TrendingDown, Clock, FileText, Search } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../lib/i18n'
import { useCreditBalance } from '../../hooks/useCreditBalance'

interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'spend' | 'bonus' | 'referral'
  description: string
  service_used?: string
  created_at: string
}

export function CreditHistoryPage() {
  const { user } = useAuth()
  const { t, isRTL } = useTranslation()
  const { balance, totalSearches, totalAnalyses } = useCreditBalance()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'purchase' | 'spend'>('all')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('credit_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('usage_date', { ascending: false })
        .limit(50)

      if (error) throw error

      // Transform data to match our interface
      const formattedTransactions: CreditTransaction[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.credits_deducted,
        type: 'spend',
        description: `${item.service_used} - ${item.credits_deducted} ${t('credit.balance')}`,
        service_used: item.service_used,
        created_at: item.usage_date
      }))

      setTransactions(formattedTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string, serviceUsed?: string) => {
    if (type === 'purchase' || type === 'bonus' || type === 'referral') {
      return <TrendingUp className="h-5 w-5 text-green-400" />
    }
    
    if (serviceUsed === 'cv-analysis') {
      return <FileText className="h-5 w-5 text-blue-400" />
    }
    
    if (serviceUsed === 'talent-search') {
      return <Search className="h-5 w-5 text-purple-400" />
    }
    
    return <TrendingDown className="h-5 w-5 text-red-400" />
  }

  const getTransactionColor = (type: string) => {
    if (type === 'purchase' || type === 'bonus' || type === 'referral') {
      return 'text-green-400'
    }
    return 'text-red-400'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    return transaction.type === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('loading.processing')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('dashboard.credit_history')}
        </h1>
        <p className="text-gray-400">
          {t('dashboard.credit_usage')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className={`flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('credit.balance')}</p>
              <p className="text-2xl font-bold text-white">{balance.toLocaleString()}</p>
            </div>
            <Zap className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className={`flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('dashboard.total_searches')}</p>
              <p className="text-2xl font-bold text-white">{totalSearches}</p>
            </div>
            <Search className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className={`flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-400 mb-1">{t('dashboard.total_analyses')}</p>
              <p className="text-2xl font-bold text-white">{totalAnalyses}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className={`flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {t('dashboard.total_searches')} + {t('dashboard.total_analyses')}
              </p>
              <p className="text-2xl font-bold text-white">{totalSearches + totalAnalyses}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className={`flex gap-4 mb-6 ${isRTL() ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {t('nav.home')} 
        </button>
        <button
          onClick={() => setFilter('purchase')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'purchase'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {t('pricing.buy_now')}
        </button>
        <button
          onClick={() => setFilter('spend')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'spend'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {t('credit.balance')}
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {t('dashboard.credit_history')}
          </h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {filter === 'all' ? 'لا توجد معاملات حتى الآن' : 'لا توجد معاملات من هذا النوع'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className={`p-6 flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-4' : 'space-x-4'}`}>
                  {getTransactionIcon(transaction.type, transaction.service_used)}
                  <div>
                    <p className="font-medium text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className={`text-right ${isRTL() ? 'text-left' : ''}`}>
                  <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'spend' ? '-' : '+'}{transaction.amount} {t('credit.balance')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}