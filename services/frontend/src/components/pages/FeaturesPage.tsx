import React from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  FileSearch, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useTranslation } from '../../lib/i18n'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

export function FeaturesPage() {
  const { t, isRTL, language } = useTranslation()

  const features = [
    {
      icon: Brain,
      title: language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI',
      description: language === 'ar' ? 'تقنيات الذكاء الاصطناعي الحديثة لتحليل دقيق للسير الذاتية والمرشحين' : 'Modern AI technologies for precise CV and candidate analysis',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileSearch,
      title: language === 'ar' ? 'تحليل السير الذاتية' : 'CV Analysis',
      description: language === 'ar' ? 'تحليل شامل للسير الذاتية مع استخراج المهارات والخبرات بدقة عالية' : 'Comprehensive CV analysis with accurate skills and experience extraction',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: language === 'ar' ? 'البحث عن المواهب' : 'Talent Search',
      description: language === 'ar' ? 'بحث متقدم في قاعدة بيانات ضخمة من المرشحين المؤهلين' : 'Advanced search in a vast database of qualified candidates',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      icon: BarChart3,
      title: language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics',
      description: language === 'ar' ? 'تقارير مفصلة وإحصائيات شاملة لعملية التوظيف' : 'Detailed reports and comprehensive statistics for recruitment',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'سرعة فائقة' : 'Lightning Fast',
      description: language === 'ar' ? 'نتائج فورية ومعالجة سريعة للبيانات' : 'Instant results and fast data processing',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: language === 'ar' ? 'أمان البيانات' : 'Data Security',
      description: language === 'ar' ? 'حماية متقدمة للبيانات الحساسة وسرية المعلومات' : 'Advanced protection for sensitive data and information confidentiality',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Globe,
      title: language === 'ar' ? 'متعدد اللغات' : 'Multi-language',
      description: language === 'ar' ? 'دعم كامل للعربية والإنجليزية مع واجهة محسنة لكل لغة' : 'Full support for Arabic and English with optimized interface',
      gradient: 'from-teal-500 to-blue-500'
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'متاح 24/7' : '24/7 Available',
      description: language === 'ar' ? 'خدمة مستمرة على مدار الساعة مع دعم فني متخصص' : 'Continuous service around the clock with specialized technical support',
      gradient: 'from-pink-500 to-rose-500'
    }
  ]

  const benefits = [
    language === 'ar' ? 'توفير 80% من وقت عملية التوظيف' : 'Save 80% of recruitment time',
    language === 'ar' ? 'تحسين جودة المرشحين بنسبة 90%' : 'Improve candidate quality by 90%',
    language === 'ar' ? 'تقليل التكاليف بنسبة 60%' : 'Reduce costs by 60%',
    language === 'ar' ? 'زيادة معدل نجاح التوظيف' : 'Increase recruitment success rate'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {language === 'ar' ? 'مميزات متقدمة' : 'Advanced Features'}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {language === 'ar' ? 'للتوظيف الذكي' : 'for Smart Recruitment'}
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            {language === 'ar' 
              ? 'اكتشف كيف تقوم تقنياتنا المتقدمة بتحويل عالم التوظيف وجعل العثور على أفضل المواهب أسهل من أي وقت مضى'
              : 'Discover how our advanced technologies are transforming recruitment and making finding the best talent easier than ever'
            }
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="group"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 h-full">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-12 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'ar' ? 'النتائج التي تحققها' : 'Results You Achieve'}
            </h2>
            <p className="text-gray-400 text-lg">
              {language === 'ar' 
                ? 'إحصائيات حقيقية من عملائنا الراضين'
                : 'Real statistics from our satisfied clients'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
                className={`text-center ${isRTL() ? 'text-right' : 'text-left'}`}
              >
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-white font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Start?'}
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'ابدأ رحلتك في التوظيف الذكي اليوم واكتشف الفرق الذي يمكن أن تحدثه التقنيات المتقدمة'
              : 'Start your smart recruitment journey today and discover the difference advanced technologies can make'
            }
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL() ? 'sm:flex-row-reverse' : ''}`}>
            <Link to="/pricing">
              <Button size="lg" className="group">
                {language === 'ar' ? 'اختر خطتك' : 'Choose Your Plan'}
                <ArrowRight className={`h-5 w-5 group-hover:translate-x-1 transition-transform ${isRTL() ? 'mr-2 group-hover:-translate-x-1' : 'ml-2'}`} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}