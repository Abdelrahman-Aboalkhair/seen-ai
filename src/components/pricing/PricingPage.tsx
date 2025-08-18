import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Zap,
  Crown,
  Building2,
  Gift,
  Users,
  Star,
  Shield,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import toast from "react-hot-toast";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_sar: number;
  discount_percentage: number;
  is_active: boolean;
  description?: string;
  original_price?: number;
  features: string[];
  icon: any;
  is_popular?: boolean;
  is_enterprise?: boolean;
}

export function PricingPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useTranslation();
  const navigate = useNavigate();
  const { balance, addCredits } = useCreditBalance();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [demoCharging, setDemoCharging] = useState<string | null>(null);

  const getPackages = (): CreditPackage[] => {
    if (language === "ar") {
      return [
        {
          id: "1",
          name: "الباقة الأساسية",
          credits: 1000,
          price_sar: 99,
          original_price: 199,
          discount_percentage: 50,
          is_active: true,
          description: "مثالية للشركات الصغيرة والبدايات",
          features: [
            "بحث أساسي عن المواهب",
            "تحليل السير الذاتية الأساسي",
            "دعم عبر البريد الإلكتروني",
            "تقارير أساسية",
            "إشعارات الوظائف الشاغرة",
            "مكتبة السير الذاتية الأساسية",
          ],
          icon: Zap,
          is_popular: false,
        },
        {
          id: "2",
          name: "الباقة الاحترافية",
          credits: 5000,
          price_sar: 399,
          original_price: 599,
          discount_percentage: 33,
          is_active: true,
          description: "الأكثر شعبية للشركات المتوسطة",
          features: [
            "بحث متقدم عن المواهب",
            "تحليل شامل للسير الذاتية",
            "دعم ذو أولوية",
            "تقارير متقدمة",
            "دمج أنظمة الموارد البشرية",
            "المطابقة الذكية المتقدمة",
            "إدارة المرشحين المتقدمة",
            "تقارير الأداء التفصيلية",
          ],
          icon: Crown,
          is_popular: true,
        },
        {
          id: "3",
          name: "الباقة المؤسسية",
          credits: 15000,
          price_sar: 999,
          original_price: 1499,
          discount_percentage: 33,
          is_active: true,
          description: "للمؤسسات الكبيرة والمنظمات",
          features: [
            "بحث غير محدود عن المواهب",
            "تحليل متقدم للسير الذاتية",
            "دعم مخصص على مدار الساعة",
            "تقارير مخصصة",
            "دمج كامل لأنظمة الموارد البشرية",
            "ذكاء اصطناعي متقدم",
            "مدير حساب مخصص",
            "تدريب الموظفين",
            "تحليلات متقدمة",
            "دعم فني مخصص",
          ],
          icon: Building2,
          is_popular: false,
          is_enterprise: true,
        },
      ];
    } else {
      return [
        {
          id: "1",
          name: "Basic Plan",
          credits: 1000,
          price_sar: 99,
          original_price: 199,
          discount_percentage: 50,
          is_active: true,
          description: "Perfect for small businesses and startups",
          features: [
            "Basic talent search",
            "Basic CV analysis",
            "Email support",
            "Basic reports",
            "Job vacancy notifications",
            "Basic CV library",
          ],
          icon: Zap,
          is_popular: false,
        },
        {
          id: "2",
          name: "Professional Plan",
          credits: 5000,
          price_sar: 399,
          original_price: 599,
          discount_percentage: 33,
          is_active: true,
          description: "Most popular for medium businesses",
          features: [
            "Advanced talent search",
            "Comprehensive CV analysis",
            "Priority support",
            "Advanced reports",
            "HR system integration",
            "Advanced smart matching",
            "Advanced candidate management",
            "Detailed performance reports",
          ],
          icon: Crown,
          is_popular: true,
        },
        {
          id: "3",
          name: "Enterprise Plan",
          credits: 15000,
          price_sar: 999,
          original_price: 1499,
          discount_percentage: 33,
          is_active: true,
          description: "For large enterprises and organizations",
          features: [
            "Unlimited talent search",
            "Advanced CV analysis",
            "24/7 dedicated support",
            "Custom reports",
            "Full HR system integration",
            "Advanced AI",
            "Dedicated account manager",
            "Staff training",
            "Advanced analytics",
            "Custom technical support",
          ],
          icon: Building2,
          is_popular: false,
          is_enterprise: true,
        },
      ];
    }
  };

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("price", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        // Transform database packages to match component interface
        const transformedPackages = data.map((pkg) => ({
          id: pkg.id.toString(),
          name: pkg.name,
          credits: pkg.credits,
          price_sar: parseFloat(pkg.price),
          discount_percentage: 0,
          is_active: true,
          description: pkg.description,
          features: [],
          icon: Zap,
        }));

        setPackages(transformedPackages);
        console.log("Packages loaded:", transformedPackages);
      } else {
        console.log("No packages found, using fallback");
        throw new Error("No packages found");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      // Use the new pricing structure
      setPackages(getPackages());
      console.log("Using new pricing packages:", getPackages());
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setPurchasing(packageId);
    try {
      const selectedPackage = packages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        throw new Error("الحزمة غير موجودة");
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            packageId: selectedPackage.id,
            customerEmail: user.email,
            returnUrl: `${window.location.origin}/dashboard?payment=success`,
          },
        }
      );

      if (error) throw error;

      if (data?.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || t("error.generic"));
      setPurchasing(null);
    }
  };

  const handleDemoCharge = async (packageId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setDemoCharging(packageId);
    try {
      const selectedPackage = packages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        throw new Error("الحزمة غير موجودة");
      }

      // Call add-credits edge function
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: {
          userId: user.id,
          amount: selectedPackage.credits,
          reason: `Demo charge for ${selectedPackage.name}`,
        },
      });

      if (error) {
        console.error("Demo charge error:", error);
        throw error;
      }

      if (data?.newBalance) {
        // Update local balance
        await addCredits(selectedPackage.credits);

        // Show success message
        toast.success(
          `تم إضافة ${selectedPackage.credits.toLocaleString()} كريديت بنجاح! \nرصيدك الجديد: ${data.newBalance.toLocaleString()} كريديت`,
          { duration: 4000 }
        );
      } else {
        throw new Error("لم يتم استلام الرصيد الجديد");
      }
    } catch (error: any) {
      console.error("Demo charge error:", error);
      toast.error(error.message || "حدث خطأ أثناء الشحن التجريبي");
    } finally {
      setDemoCharging(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#10172A] to-[#19223C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38BDF8] mx-auto mb-4"></div>
          <p className="text-[#CBD5E1]">{t("loading.processing")}</p>
        </div>
      </div>
    );
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
            {language === "ar" ? "خطط التسعير" : "Pricing Plans"}
          </h1>
          <p className="text-xl text-[#CBD5E1] max-w-3xl mx-auto">
            {language === "ar"
              ? "اختر الخطة المناسبة لاحتياجاتك واحصل على أفضل قيمة مقابل أموالك"
              : "Choose the plan that fits your needs and get the best value for your money"}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, index) => {
            const Icon = pkg.icon;
            const isPopular = pkg.is_popular;
            const isEnterprise = pkg.is_enterprise;

            return (
              <div
                key={pkg.id}
                className={`relative bg-[#1E293B] rounded-2xl p-8 border shadow-lg ${
                  isPopular
                    ? "border-[#38BDF8] ring-2 ring-[#38BDF8]/20"
                    : isEnterprise
                    ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/20"
                    : "border-[#334155] hover:border-[#334155]/80"
                } transition-all duration-300 hover:scale-105`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] text-white px-4 py-1 rounded-full text-sm font-medium">
                      {language === "ar" ? "الأكثر شعبية" : "Most Popular"}
                    </span>
                  </div>
                )}

                {isEnterprise && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 py-1 rounded-full text-sm font-medium">
                      {language === "ar" ? "مؤسسي" : "Enterprise"}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <Icon
                    className={`h-12 w-12 mx-auto mb-4 ${
                      isPopular
                        ? "text-[#38BDF8]"
                        : isEnterprise
                        ? "text-[#F59E0B]"
                        : "text-[#CBD5E1]"
                    }`}
                  />
                  <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">
                    {pkg.name}
                  </h3>

                  {/* Price Display */}
                  <div className="mb-2">
                    {pkg.original_price &&
                      pkg.original_price > pkg.price_sar && (
                        <div className="text-lg text-[#94A3B8] line-through">
                          {pkg.original_price}{" "}
                          {language === "ar" ? "ر.س" : "SAR"}
                        </div>
                      )}
                    <div className="text-4xl font-bold text-[#F8FAFC]">
                      {pkg.price_sar} {language === "ar" ? "ر.س" : "SAR"}
                    </div>
                    {pkg.discount_percentage > 0 && (
                      <div className="text-sm text-[#22C55E] font-medium">
                        {language === "ar"
                          ? `توفير ${pkg.discount_percentage}%`
                          : `${pkg.discount_percentage}% OFF`}
                      </div>
                    )}
                  </div>

                  <div className="text-[#38BDF8] font-medium">
                    {pkg.credits.toLocaleString()}{" "}
                    {language === "ar" ? "كريديت" : "Credits"}
                  </div>
                  {pkg.description && (
                    <p className="text-[#94A3B8] text-sm mt-2">
                      {pkg.description}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className={`flex items-start ${
                        isRTL() ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Check
                        className={`h-5 w-5 text-[#22C55E] mt-0.5 flex-shrink-0 ${
                          isRTL() ? "ml-3" : "mr-3"
                        }`}
                      />
                      <span className="text-[#CBD5E1] text-sm">{feature}</span>
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
                        ? "bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white"
                        : isEnterprise
                        ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white"
                        : "bg-[#334155] hover:bg-[#475569] text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]`}
                  >
                    {purchasing === pkg.id ? (
                      <div
                        className={`flex items-center justify-center ${
                          isRTL() ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${
                            isRTL() ? "ml-2" : "mr-2"
                          }`}
                        ></div>
                        {language === "ar" ? "جاري الشراء..." : "Processing..."}
                      </div>
                    ) : language === "ar" ? (
                      "اشتر الآن"
                    ) : (
                      "Buy Now"
                    )}
                  </button>

                  {/* Demo Charge Button */}
                  <button
                    onClick={() => handleDemoCharge(pkg.id)}
                    disabled={demoCharging === pkg.id || !user}
                    className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 bg-[#22C55E] hover:bg-[#16A34A] text-white border-2 border-[#22C55E] hover:border-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                  >
                    {demoCharging === pkg.id ? (
                      <div
                        className={`flex items-center justify-center ${
                          isRTL() ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${
                            isRTL() ? "ml-2" : "mr-2"
                          }`}
                        ></div>
                        {language === "ar" ? "جاري الشحن..." : "Charging..."}
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-center ${
                          isRTL() ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Gift
                          className={`h-5 w-5 ${isRTL() ? "ml-2" : "mr-2"}`}
                        />
                        {language === "ar" ? "شحن تجريبي" : "Demo Charge"}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div className="bg-[#1E293B] rounded-2xl p-8 max-w-4xl mx-auto shadow-lg border border-[#334155]">
            <h3 className="text-2xl font-bold text-[#F8FAFC] mb-6">
              {language === "ar" ? "ميزات إضافية" : "Additional Features"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[#CBD5E1]">
              <div
                className={`flex items-center justify-center ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <Star
                  className={`h-6 w-6 text-[#EAB308] ${
                    isRTL() ? "ml-3" : "mr-3"
                  }`}
                />
                <span>
                  {language === "ar"
                    ? "200 كريديت مجاني عند التسجيل"
                    : "200 Free Credits on Signup"}
                </span>
              </div>
              <div
                className={`flex items-center justify-center ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <Users
                  className={`h-6 w-6 text-[#22C55E] ${
                    isRTL() ? "ml-3" : "mr-3"
                  }`}
                />
                <span>
                  {language === "ar"
                    ? "100 كريديت للإحالة"
                    : "100 Credits for Referrals"}
                </span>
              </div>
              <div
                className={`flex items-center justify-center ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <Shield
                  className={`h-6 w-6 text-[#38BDF8] ${
                    isRTL() ? "ml-3" : "mr-3"
                  }`}
                />
                <span>
                  {language === "ar"
                    ? "ضمان استرداد الأموال"
                    : "Money Back Guarantee"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
