import React from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Calendar, 
  Star,
  ExternalLink,
  Award,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Building2
} from 'lucide-react'
import { useTranslation } from '../../lib/i18n'

interface CandidateProps {
  candidate: {
    'Current Position': string
    'Full Name': string
    'LinkedIn URL': string
    'Match Score (0-100)': number
    'Skills Match': string
    'Experience Match': string
    Summary: string
    Ranking: string
    educationMatch: string
    cultureFit: string
    strengths: string
    gaps: string
  }
  index: number
}

export function CandidateCard({ candidate, index }: CandidateProps) {
  const { t, isRTL } = useTranslation()
  
  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/30'
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
    return 'text-red-500 bg-red-500/10 border-red-500/30'
  }
  
  const getRankingIcon = (ranking: string) => {
    if (ranking.includes('Strong') || ranking.includes('قوي')) return <Star className="h-4 w-4 text-yellow-500" />
    if (ranking.includes('Good') || ranking.includes('جيد')) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-orange-500" />
  }
  
  const parseSkills = (skillsText: string) => {
    // Extract skills from the complex string format
    const skills = []
    if (skillsText.includes('Azure')) skills.push('Azure')
    if (skillsText.includes('ADFS')) skills.push('ADFS')
    if (skillsText.includes('IAM')) skills.push('IAM')
    if (skillsText.includes('Identity')) skills.push('Digital Identity')
    if (skillsText.includes('Security') || skillsText.includes('CyberSecurity')) skills.push('Security')
    if (skillsText.includes('Project Management')) skills.push('Project Management')
    if (skillsText.includes('Leadership')) skills.push('Leadership')
    return skills.slice(0, 4) // Show max 4 skills
  }
  
  const parseExperience = (experienceText: string) => {
    const match = experienceText.match(/(\d+)\+?\s*years?/i)
    return match ? `${match[1]}+ سنوات` : 'خبرة متنوعة'
  }
  
  const skills = parseSkills(candidate['Skills Match'])
  const experience = parseExperience(candidate['Experience Match'])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Header */}
      <div className={`flex items-start justify-between mb-4 ${isRTL() ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1">
          <div className={`flex items-center mb-2 ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {candidate['Full Name']}
              </h3>
              <div className={`flex items-center text-gray-400 text-sm ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Building2 className="h-4 w-4" />
                <span className="line-clamp-1">{candidate['Current Position']}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Match Score */}
        <div className={`flex flex-col items-center ${getMatchColor(candidate['Match Score (0-100)'])} border rounded-lg p-3 min-w-[80px]`}>
          <div className="text-2xl font-bold">
            {candidate['Match Score (0-100)']}%
          </div>
          <div className="text-xs opacity-80">مطابقة</div>
        </div>
      </div>
      
      {/* Ranking */}
      <div className={`flex items-center mb-4 ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
        {getRankingIcon(candidate.Ranking)}
        <span className="text-sm font-medium text-gray-300">
          {candidate.Ranking}
        </span>
      </div>
      
      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">المهارات الرئيسية:</h4>
          <div className={`flex flex-wrap gap-2 ${isRTL() ? 'flex-row-reverse' : ''}`}>
            {skills.map((skill, idx) => (
              <span 
                key={idx}
                className="bg-cyan-500/20 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full border border-cyan-500/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Experience */}
      <div className={`flex items-center mb-4 ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">
          سنوات الخبرة: <span className="text-white font-medium">{experience}</span>
        </span>
      </div>
      
      {/* Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">ملخص التقييم:</h4>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
          {candidate.Summary}
        </p>
      </div>
      
      {/* Strengths */}
      {candidate.strengths && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-400 mb-2">نقاط القوة:</h4>
          <div className="text-sm text-gray-400">
            {candidate.strengths.split('\n').slice(0, 3).map((strength, idx) => (
              <div key={idx} className={`flex items-start mb-1 ${isRTL() ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className={`h-3 w-3 text-green-400 mt-0.5 flex-shrink-0 ${isRTL() ? 'ml-2' : 'mr-2'}`} />
                <span className="text-xs">{strength.replace('•', '').trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className={`flex items-center justify-between pt-4 border-t border-gray-700 ${isRTL() ? 'flex-row-reverse' : ''}`}>
        <a 
          href={candidate['LinkedIn URL']} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-sm ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}
        >
          <ExternalLink className="h-4 w-4" />
          <span>عرض الملف الشخصي</span>
        </a>
        
        <div className={`flex items-center text-xs text-gray-500 ${isRTL() ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
          <TrendingUp className="h-3 w-3" />
          <span>تم التحليل بواسطة الذكاء الاصطناعي</span>
        </div>
      </div>
    </motion.div>
  )
}