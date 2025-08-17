import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'
import { 
  BrainCircuit, 
  Search, 
  FileSearch, 
  Users, 
  Zap, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react'

export function HomePage() {
  const { t } = useTranslation()
  
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: t('homepage.features.ai_talent_search.title' as any),
      description: t('homepage.features.ai_talent_search.description' as any),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FileSearch className="h-8 w-8" />,
      title: t('homepage.features.cv_analysis.title' as any),
      description: t('homepage.features.cv_analysis.description' as any),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: t('homepage.features.smart_management.title' as any),
      description: t('homepage.features.smart_management.description' as any),
      gradient: 'from-green-500 to-teal-500'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: t('homepage.features.instant_results.title' as any),
      description: t('homepage.features.instant_results.description' as any),
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  const stats = [
    { number: '10,000+', label: t('homepage.stats.candidates_analyzed' as any) },
    { number: '500+', label: t('homepage.stats.companies_trust' as any) },
    { number: '95%', label: t('homepage.stats.matching_accuracy' as any) },
    { number: '24/7', label: t('homepage.stats.service_available' as any) }
  ]

  const packages = [
    {
      name: t('homepage.pricing_section.starter.name' as any),
      credits: 500,
      price: 99,
      discount: 0,
      features: [
        `500 ${t('homepage.pricing_section.starter.features.credits' as any)}`,
        t('homepage.pricing_section.starter.features.search_candidates' as any),
        t('homepage.pricing_section.starter.features.analyze_cvs' as any),
        t('homepage.pricing_section.starter.features.support' as any)
      ]
    },
    {
      name: t('homepage.pricing_section.professional.name' as any),
      credits: 1500,
      price: 249,
      discount: 10,
      features: [
        `1500 ${t('homepage.pricing_section.professional.features.credits' as any)}`,
        t('homepage.pricing_section.professional.features.search_candidates' as any),
        t('homepage.pricing_section.professional.features.analyze_cvs' as any),
        t('homepage.pricing_section.professional.features.advanced_reports' as any),
        t('homepage.pricing_section.professional.features.priority_support' as any)
      ],
      popular: true
    },
    {
      name: t('homepage.pricing_section.enterprise.name' as any),
      credits: 3500,
      price: 499,
      discount: 20,
      features: [
        `3500 ${t('homepage.pricing_section.enterprise.features.credits' as any)}`,
        t('homepage.pricing_section.enterprise.features.unlimited_search' as any),
        t('homepage.pricing_section.enterprise.features.unlimited_analysis' as any),
        t('homepage.pricing_section.enterprise.features.custom_api' as any),
        t('homepage.pricing_section.enterprise.features.account_manager' as any)
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <Sparkles className="h-6 w-6 text-cyan-400 mr-2" />
                <span className="text-cyan-400 font-medium">{t('homepage.hero.ai_powered' as any)}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t('homepage.hero.future_of_hiring' as any)}
                </span>
                <br />
                <span className="text-white">{t('homepage.hero.with_ai' as any)}</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                {t('homepage.hero.description' as any)}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="group">
                    {t('homepage.hero.start_now_free' as any)}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="secondary" size="lg">
                  {t('homepage.hero.learn_more' as any)}
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{t('homepage.hero.free_days' as any)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{t('homepage.hero.no_credit_card' as any)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{t('homepage.hero.cancel_anytime' as any)}</span>
                </div>
              </div>
            </motion.div>

            {/* AI Robot Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Glowing Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-dashed"
                  style={{ width: '400px', height: '400px' }}
                />
                
                {/* Robot Container */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-500/30"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-cyan-400"
                  >
                    <Bot className="h-32 w-32" />
                  </motion.div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [-5, 5, -5], x: [-3, 3, -3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-10 right-10 w-4 h-4 bg-cyan-400 rounded-full opacity-70"
                  />
                  <motion.div
                    animate={{ y: [5, -5, 5], x: [3, -3, 3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-10 left-10 w-3 h-3 bg-blue-400 rounded-full opacity-70"
                  />
                  <motion.div
                    animate={{ y: [-3, 3, -3], x: [-2, 2, -2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    className="absolute top-20 left-12 w-2 h-2 bg-purple-400 rounded-full opacity-70"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('homepage.features.title' as any)}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t('homepage.features.subtitle' as any)}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:transform hover:scale-105 transition-all duration-300 group">
                  <CardContent>
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${feature.gradient} p-4 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('homepage.pricing_section.title' as any)}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t('homepage.pricing_section.subtitle' as any)}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${pkg.popular ? 'transform scale-105' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('pricing.popular' as any)}
                    </span>
                  </div>
                )}
                
                <Card className={`h-full ${pkg.popular ? 'border-cyan-500/50 shadow-cyan-500/20' : ''}`}>
                  <CardContent>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-cyan-400">{pkg.price}</span>
                        <span className="text-gray-400 text-lg"> {t('homepage.pricing_section.sar' as any)}</span>
                        {pkg.discount > 0 && (
                          <div className="text-sm text-green-400 mt-1">
                            {t('homepage.pricing_section.save_percent' as any)} {pkg.discount}%
                          </div>
                        )}
                      </div>
                      
                      <ul className="space-y-3 mb-8 text-left">
                        {pkg.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-gray-300">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link to="/signup">
                        <Button 
                          variant={pkg.popular ? 'primary' : 'secondary'} 
                          className="w-full"
                        >
                          {t('homepage.pricing_section.get_started' as any)}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardContent>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {t('homepage.cta.title' as any)}
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  {t('homepage.cta.subtitle' as any)}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button size="lg" className="group">
                      {t('homepage.cta.start_free' as any)}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="secondary" size="lg">
                      {t('homepage.cta.talk_expert' as any)}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}