import React, { useState } from 'react'
import { FileText, Upload, Zap, AlertCircle, Users, Filter, SortDesc } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../lib/i18n'
import { useCreditBalance } from '../../hooks/useCreditBalance'
import { CandidateCard } from '../ui/CandidateCard'
import toast from 'react-hot-toast'

// Import demo data
import hrTestData from '../../../public/hr-test-data.json'

export function CVAnalysisPage() {
  const { user } = useAuth()
  const { t, isRTL } = useTranslation()
  const { balance, deductCredits } = useCreditBalance()
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [skillsRequired, setSkillsRequired] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [sortBy, setSortBy] = useState('match_score')
  const [filterByScore, setFilterByScore] = useState('all')
  
  const CREDITS_COST = 5

  const handleAnalyze = async () => {
    if (!user) {
      toast.error(t('error.unauthorized'))
      return
    }

    if (balance < CREDITS_COST) {
      toast.error(t('credit.insufficient'))
      return
    }

    if (!jobTitle.trim() || !skillsRequired.trim() || !files || files.length === 0) {
      toast.error(t('error.validation'))
      return
    }

    setAnalyzing(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Use demo data for analysis results
      let analysisResults = [...hrTestData]
      
      // Filter based on job title and description (simple text matching)
      if (jobTitle.trim() || jobDescription.trim()) {
        const searchTerms = `${jobTitle} ${jobDescription}`.toLowerCase()
        analysisResults = analysisResults.filter(candidate => 
          candidate['Current Position'].toLowerCase().includes(searchTerms) ||
          candidate['Skills Match'].toLowerCase().includes(searchTerms) ||
          searchTerms.split(' ').some(term => 
            candidate['Skills Match'].toLowerCase().includes(term) ||
            candidate['Experience Match'].toLowerCase().includes(term)
          )
        )
      }
      
      // Limit results based on number of files uploaded (simulate file count)
      const maxResults = Math.min(files.length * 2, 12) // 2 candidates per file, max 12
      analysisResults = analysisResults.slice(0, maxResults)
      
      // Deduct credits and update balance
      await deductCredits(CREDITS_COST)
      
      setResults(analysisResults)
      setShowResults(true)
      toast.success(`تم تحليل ${files.length} ملف والعثور على ${analysisResults.length} مرشح مناسب!`)
    } catch (error: any) {
      console.error('CV Analysis error:', error)
      toast.error(error.message || t('error.generic'))
    } finally {
      setAnalyzing(false)
    }
  }
  
  // Filter and sort results (same as TalentSearchPage)
  const getFilteredAndSortedResults = () => {
    let filteredResults = [...results]
    
    // Filter by score
    if (filterByScore === 'high') {
      filteredResults = filteredResults.filter(c => c['Match Score (0-100)'] >= 80)
    } else if (filterByScore === 'medium') {
      filteredResults = filteredResults.filter(c => c['Match Score (0-100)'] >= 60 && c['Match Score (0-100)'] < 80)
    } else if (filterByScore === 'low') {
      filteredResults = filteredResults.filter(c => c['Match Score (0-100)'] < 60)
    }
    
    // Sort results
    if (sortBy === 'match_score') {
      filteredResults.sort((a, b) => b['Match Score (0-100)'] - a['Match Score (0-100)'])
    } else if (sortBy === 'name') {
      filteredResults.sort((a, b) => a['Full Name'].localeCompare(b['Full Name']))
    }
    
    return filteredResults
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('services.cv_analysis.title')}
        </h1>
        <p className="text-gray-400">
          {t('services.cv_analysis.description')}
        </p>
      </div>

      {/* Stats Cards - Similar to Credit History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm text-gray-400 mb-1">{t('services.cv_analysis.cost')}</p>
              <p className="text-2xl font-bold text-white">{CREDITS_COST}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className={`flex items-center justify-between ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div>
              <p className="text-sm text-gray-400 mb-1">الحالة</p>
              <p className={`text-lg font-semibold ${balance >= CREDITS_COST ? 'text-green-400' : 'text-red-400'}`}>
                {balance >= CREDITS_COST ? 'جاهز للتحليل' : 'رصيد غير كافي'}
              </p>
            </div>
            <AlertCircle className={`h-8 w-8 ${balance >= CREDITS_COST ? 'text-green-400' : 'text-red-400'}`} />
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
        <div className="p-6 border-b border-slate-700 -m-6 mb-6">
          <h2 className="text-xl font-semibold text-white">
            {t('services.cv_analysis.analysis_details')}
          </h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('services.cv_analysis.job_title')} *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t('form.placeholder.job_title')}
              dir={isRTL() ? 'rtl' : 'ltr'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('services.cv_analysis.job_description')} ({t('form.optional')})
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t('form.placeholder.job_description')}
              dir={isRTL() ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('services.cv_analysis.skills_required')} *
            </label>
            <textarea
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t('form.placeholder.skills_required')}
              dir={isRTL() ? 'rtl' : 'ltr'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('services.cv_analysis.upload_cv')} *
            </label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors bg-slate-900">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  {t('services.cv_analysis.upload_instruction')}
                </p>
                <p className="text-sm text-gray-400">
                  {t('services.cv_analysis.supported_formats')}
                </p>
              </label>
            </div>
            {files && files.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-400">
                  {files.length} {t('services.cv_analysis.files_selected')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing || balance < CREDITS_COST || !jobTitle.trim() || !skillsRequired.trim() || !files || files.length === 0}
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {analyzing ? (
          <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
            <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL() ? 'ml-2' : 'mr-2'}`}></div>
            {t('services.cv_analysis.analyzing')}
          </div>
        ) : (
          `${t('services.cv_analysis.start_analysis')} (${CREDITS_COST} ${t('services.cv_analysis.cost')})`
        )}
      </button>

      {/* Results */}
      {showResults && results.length > 0 && (
        <>
          {/* Results Header and Controls */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className={`flex items-center ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                <Users className="h-6 w-6 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">
                  نتائج تحليل السير الذاتية ({getFilteredAndSortedResults().length})
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter by Score */}
                <div className={`flex items-center ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterByScore}
                    onChange={(e) => setFilterByScore(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">جميع النسب</option>
                    <option value="high">عالية (80%+)</option>
                    <option value="medium">متوسطة (60-79%)</option>
                    <option value="low">منخفضة (&lt;60%)</option>
                  </select>
                </div>
                
                {/* Sort */}
                <div className={`flex items-center ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <SortDesc className="h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="match_score">حسب نسبة التطابق</option>
                    <option value="name">حسب الاسم</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAndSortedResults().map((candidate, index) => (
              <CandidateCard key={index} candidate={candidate} index={index} />
            ))}
          </div>

          {getFilteredAndSortedResults().length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                لا توجد نتائج تطابق الفلاتر المحددة
              </h3>
              <p className="text-gray-400">
                جرب تغيير معايير التصفية أو البحث
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}