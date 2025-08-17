import React, { useState, useEffect } from 'react'
import { Check, Zap, Crown, Building2, Gift } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n'
import { useCreditBalance } from '../../hooks/useCreditBalance'
import toast from 'react-hot-toast'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price_sar: number
  discount_percentage: number
  is_active: boolean
  description?: string
}

export function PricingPage() {
  const { user } = useAuth()
  const { t, isRTL, language } = useTranslation()
  const navigate = useNavigate()
  const { balance, addCredits } = useCreditBalance()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [demoCharging, setDemoCharging] = useState<string | null>(null)

  const getArabicPackageName = (englishName: string) => {
    const nameMap: { [key: string]: string } = {
      'Starter Pack': 'حزمة البداية',
      'Professional Pack': 'حزمة المحترف', 
      'Enterprise Pack': 'حزمة المؤسسة'
    }
    return nameMap[englishName] || englishName
  }

  const getArabicPackageDescription = (englishName: string) => {
    const descriptionMap: { [key: string]: string } = {
      'Starter Pack': 'مثالية للشركات الصغيرة والأفراد',
      'Professional Pack': 'الأكثر شعبية للشركات المتوسطة',
      'Enterprise Pack': 'للمؤسسات الكبيرة والمنظمات'
    }
    return descriptionMap[englishName] || ''
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('price', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      if (data && data.length > 0) {
        // Transform database packages to match component interface
        const transformedPackages = data.map(pkg => ({
          id: pkg.id.toString(),
          name: language === 'ar' ? getArabicPackageName(pkg.name) : pkg.name,
          credits: pkg.credits,
          price_sar: parseFloat(pkg.price),
          discount_percentage: 0,
          is_active: true,
          description: language === 'ar' ? getArabicPackageDescription(pkg.name) : pkg.description
        }))
        
        setPackages(transformedPackages)
        console.log('Packages loaded:', transformedPackages)
      } else {
        console.log('No packages found, using fallback')
        throw new Error('No packages found')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      
      // Fallback packages if database fails
      const fallbackPackages: CreditPackage[] = [
        {
          id: '1',
          name: language === 'ar' ? 'حزمة البداية' : 'Starter Pack',
          credits: 500,
          price_sar: 50,
          discount_percentage: 0,
          is_active: true,
          description: language === 'ar' ? 'مثالية للشركات الصغيرة والأفراد' : 'Perfect for small businesses and individuals'
        },
        {
          id: '2',
          name: language === 'ar' ? 'حزمة المحترف' : 'Professional Pack',
          credits: 2000,
          price_sar: 150,
          discount_percentage: 0,
          is_active: true,
          description: language === 'ar' ? 'الأكثر شعبية للشركات المتوسطة' : 'Most popular for medium businesses'
        },
        {
          id: '3',
          name: language === 'ar' ? 'حزمة المؤسسة' : 'Enterprise Pack',
          credits: 10000,
          price_sar: 500,
          discount_percentage: 0,
          is_active: true,
          description: language === 'ar' ? 'للمؤسسات الكبيرة والمنظمات' : 'For large enterprises and organizations'
        }
      ]
      
      setPackages(fallbackPackages)
      console.log('Using fallback packages:', fallbackPackages)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    setPurchasing(packageId)
    try {
      const selectedPackage = packages.find(p => p.id === packageId)
      if (!selectedPackage) {
        throw new Error('الحزمة غير موجودة')
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          packageId: selectedPackage.id,
          customerEmail: user.email,
          returnUrl: `${window.location.origin}/dashboard?payment=success`
        }
      })

      if (error) throw error

      if (data?.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      toast.error(error.message || t('error.generic'))
      setPurchasing(null)
    }
  }

  const handleDemoCharge = async (packageId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    setDemoCharging(packageId)
    try {
      const selectedPackage = packages.find(p => p.id === packageId)
      if (!selectedPackage) {
        throw new Error('الحزمة غير موجودة')
      }

      // Call add-credits edge function
      const { data, error } = await supabase.functions.invoke('add-credits', {
        body: {
          userId: user.id,
          amount: selectedPackage.credits,
          reason: `Demo charge for ${selectedPackage.name}`
        }
      })

      if (error) {
        console.error('Demo charge error:', error)
        throw error
      }

      if (data?.newBalance) {
        // Update local balance
        await addCredits(selectedPackage.credits)
        
        // Show success message
        toast.success(
          `تم إضافة ${selectedPackage.credits.toLocaleString()} كريديت بنجاح! \nرصيدك الجديد: ${data.newBalance.toLocaleString()} كريديت`,
          { duration: 4000 }
        )
      } else {
        throw new Error('لم يتم استلام الرصيد الجديد')
      }
    } catch (error: any) {
      console.error('Demo charge error:', error)
      toast.error(error.message || 'حدث خطأ أثناء الشحن التجريبي')
    } finally {
      setDemoCharging(null)
    }
  }

  const getPackageIcon = (index: number) => {
    const icons = [Zap, Crown, Building2]
    return icons[index] || Zap
  }

  const getPackageFeatures = (index: number) => {
    const features = {
      ar: [
        [
          'بحث أساسي عن المواهب',
          'تحليل السير الذاتية',
          'دعم عبر البريد الإلكتروني',
          'تقارير أساسية'
        ],
        [
          'بحث متقدم عن المواهب',
          'تحليل شامل للسير الذاتية',
          'دعم ذو أولوية',
          'تقارير متقدمة',
          'دمج أنظمة الموارد البشرية',
          'المطابقة الذكية المتقدمة'
        ],
        [
          'بحث غير محدود عن المواهب',
          'تحليل متقدم للسير الذاتية',
          'دعم مخصص على مدار الساعة',
          'تقارير مخصصة',
          'دمج كامل لأنظمة الموارد البشرية',
          'ذكاء اصطناعي متقدم',
          'مدير حساب مخصص',
          'تدريب الموظفين'
        ]
      ],
      en: [
        [
          'Basic talent search',
          'CV analysis',
          'Email support',
          'Basic reports'
        ],
        [
          'Advanced talent search',
          'Comprehensive CV analysis',
          'Priority support',
          'Advanced reports',
          'HR system integration',
          'Advanced smart matching'
        ],
        [
          'Unlimited talent search',
          'Advanced CV analysis',
          '24/7 dedicated support',
          'Custom reports',
          'Full HR system integration',
          'Advanced AI',
          'Dedicated account manager',
          'Staff training'
        ]
      ]
    }
    return features[language][index] || features[language][0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#10172A] to-[#19223C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38BDF8] mx-auto mb-4"></div>
          <p className="text-[#CBD5E1]">{t('loading.processing')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#10172A] to-[#19223C] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Current Balance Display */}
        {user && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-[#1E293B] rounded-xl p-4 shadow-lg border border-[#334155]">
              <Zap className="h-6 w-6 text-[#38BDF8] ml-2" />
              <span className="text-[#F8FAFC] font-medium">
                رصيدك الحالي: {balance?.toLocaleString() || 0} كريديت
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-6">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-[#CBD5E1] max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, index) => {
            const Icon = getPackageIcon(index)
            const features = getPackageFeatures(index)
            const isPopular = pkg.name.includes('المحترف') || pkg.name.includes('Professional')
            
            return (
              <div
                key={pkg.id}
                className={`relative bg-[#1E293B] rounded-2xl p-8 border shadow-lg ${
                  isPopular
                    ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                    : 'border-[#334155] hover:border-[#334155]/80'
                } transition-all duration-300 hover:scale-105`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('pricing.popular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <Icon className={`h-12 w-12 mx-auto mb-4 ${
                    isPopular ? 'text-[#38BDF8]' : 'text-[#CBD5E1]'
                  }`} />
                  <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-4xl font-bold text-[#F8FAFC] mb-2">
                    {pkg.price_sar} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </div>
                  <div className="text-[#38BDF8] font-medium">
                    {pkg.credits.toLocaleString()} {t('credit.balance')}
                  </div>
                  {pkg.description && (
                    <p className="text-[#94A3B8] text-sm mt-2">
                      {pkg.description}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-start ${isRTL() ? 'flex-row-reverse' : ''}`}>
                      <Check className={`h-5 w-5 text-[#22C55E] mt-0.5 flex-shrink-0 ${isRTL() ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-[#CBD5E1]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                      isPopular
                        ? 'bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white'
                        : 'bg-[#334155] hover:bg-[#475569] text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]`}
                  >
                    {purchasing === pkg.id ? (
                      <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
                        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL() ? 'ml-2' : 'mr-2'}`}></div>
                        {t('pricing.purchasing')}
                      </div>
                    ) : (
                      t('pricing.buy_now')
                    )}
                  </button>

                  {/* Demo Charge Button */}
                  <button
                    onClick={() => handleDemoCharge(pkg.id)}
                    disabled={demoCharging === pkg.id || !user}
                    className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 bg-[#22C55E] hover:bg-[#16A34A] text-white border-2 border-[#22C55E] hover:border-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                  >
                    {demoCharging === pkg.id ? (
                      <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
                        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL() ? 'ml-2' : 'mr-2'}`}></div>
                        جاري الشحن...
                      </div>
                    ) : (
                      <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
                        <Gift className={`h-5 w-5 ${isRTL() ? 'ml-2' : 'mr-2'}`} />
                        شحن تجريبي
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div className="bg-[#1E293B] rounded-2xl p-8 max-w-4xl mx-auto shadow-lg border border-[#334155]">
            <h3 className="text-2xl font-bold text-[#F8FAFC] mb-4">
              {language === 'ar' ? 'ميزات إضافية' : 'Additional Features'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#CBD5E1]">
              <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
                <Zap className={`h-6 w-6 text-[#EAB308] ${isRTL() ? 'ml-3' : 'mr-3'}`} />
                <span>200 {t('pricing.free_signup_credits')}</span>
              </div>
              <div className={`flex items-center justify-center ${isRTL() ? 'flex-row-reverse' : ''}`}>
                <Zap className={`h-6 w-6 text-[#22C55E] ${isRTL() ? 'ml-3' : 'mr-3'}`} />
                <span>100 {t('pricing.referral_credits')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}