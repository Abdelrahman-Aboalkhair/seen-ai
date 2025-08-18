import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  Search,
  FileSearch,
  CreditCard,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  History,
  Zap,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface DashboardStats {
  totalSearches: number;
  totalAnalyses: number;
  creditsUsed: number;
  recentActivity: any[];
}

export function DashboardOverview() {
  const { user, profile } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance, totalSearches, totalAnalyses, refetch } = useCreditBalance();
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      loadRecentActivity();
    }
  }, [user]);

  useEffect(() => {
    // Check for payment success
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast.success("تم الدفع بنجاح! تم إضافة الكريديت إلى حسابك", {
        duration: 6000,
        icon: "🎉",
      });
      // Refresh balance to show updated credits
      if (refetch) {
        refetch();
      }
      // Clear the payment parameter from URL
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, t, refetch]);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);

      // Get recent activity from credit usage logs
      const { data: activities } = await supabase
        .from("credit_usage_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("usage_date", { ascending: false })
        .limit(5);

      setRecentActivity(activities || []);
    } catch (error) {
      console.error("Error loading recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: t("services.talent_search.title"),
      description: t("services.talent_search.description"),
      icon: Search,
      href: "/dashboard/talent-search",
      gradient: "from-blue-500 to-cyan-500",
      cost: `10 ${t("services.talent_search.cost")}`,
    },
    {
      title: "سجل البحث عن المواهب",
      description: "عرض جميع عمليات البحث السابقة",
      icon: History,
      href: "/dashboard/talent-search-history",
      gradient: "from-purple-500 to-pink-500",
      cost: "مجاني",
    },
    {
      title: t("services.cv_analysis.title"),
      description: t("services.cv_analysis.description"),
      icon: FileSearch,
      href: "/dashboard/cv-analysis",
      gradient: "from-purple-500 to-pink-500",
      cost: `5 ${t("services.cv_analysis.cost")}`,
    },
    {
      title: "سجل تحليل السير الذاتية",
      description: "عرض جميع التحليلات السابقة",
      icon: FileText,
      href: "/dashboard/cv-analysis-history",
      gradient: "from-blue-500 to-indigo-500",
      cost: "مجاني",
    },
    {
      title: t("pricing.buy_now"),
      description: t("credit.buy_more"),
      icon: CreditCard,
      href: "/pricing",
      gradient: "from-green-500 to-teal-500",
      cost: t("nav.pricing"),
    },
  ];

  const statCards = [
    {
      title: t("dashboard.total_searches"),
      value: totalSearches,
      icon: Search,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: t("dashboard.total_analyses"),
      value: totalAnalyses,
      icon: FileSearch,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: t("credit.balance"),
      value: balance,
      icon: Target,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      title: t("dashboard.credit_usage"),
      value: totalSearches * 10 + totalAnalyses * 5,
      icon: BarChart3,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between ${
            isRTL() ? "md:flex-row-reverse" : ""
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("message.welcome")},{" "}
              {profile?.full_name || t("message.welcome")}
            </h1>
            <p className="text-gray-400">{t("company.description")}</p>
          </div>

          {balance < 50 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4 md:mt-0"
            >
              <Link to="/pricing">
                <Button className="group">
                  <Sparkles
                    className={`h-4 w-4 ${isRTL() ? "ml-2" : "mr-2"}`}
                  />
                  {t("credit.buy_more")}
                  <ArrowRight
                    className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${
                      isRTL() ? "mr-2 group-hover:-translate-x-1" : "ml-2"
                    }`}
                  />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 + index * 0.1 }}
          >
            <Card className="group hover:transform hover:scale-105 transition-all duration-300">
              <div className="p-6">
                <div
                  className={`flex items-center ${
                    isRTL() ? "space-x-reverse space-x-4" : "space-x-4"
                  }`}
                >
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className={isRTL() ? "text-right" : ""}>
                    <p className="text-sm font-medium text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "..." : stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {isRTL() ? "إجراءات سريعة" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
            >
              <Card className="group hover:transform hover:scale-105 transition-all duration-300 h-full">
                <div className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {action.description}
                  </p>
                  <div
                    className={`flex items-center justify-between ${
                      isRTL() ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="text-xs text-cyan-400 font-medium">
                      {action.cost}
                    </span>
                    <Link to={action.href}>
                      <Button size="sm" variant="secondary" className="group">
                        {isRTL() ? "ابدأ الآن" : "Start Now"}
                        <ArrowRight
                          className={`h-3 w-3 group-hover:translate-x-1 transition-transform ${
                            isRTL() ? "mr-2 group-hover:-translate-x-1" : "ml-2"
                          }`}
                        />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div
          className={`flex items-center justify-between mb-6 ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <h2 className="text-2xl font-bold text-white">
            {isRTL() ? "النشاط الأخير" : "Recent Activity"}
          </h2>
          <Link to="/dashboard/credit-history">
            <Button variant="text" size="sm" className="group">
              {t("dashboard.credit_history")}
              <History
                className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${
                  isRTL() ? "mr-2 group-hover:-translate-x-1" : "ml-2"
                }`}
              />
            </Button>
          </Link>
        </div>

        <Card>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-gray-400 mt-2">{t("loading.processing")}</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isRTL() ? "لا يوجد نشاط حتى الآن" : "No activity yet"}
                </h3>
                <p className="text-gray-400 mb-4">
                  {isRTL()
                    ? "ابدأ استخدام النظام لرؤية أنشطتك هنا"
                    : "Start using the system to see your activities here"}
                </p>
                <Link to="/dashboard/talent-search">
                  <Button>{t("services.talent_search.title")}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className={`flex items-center justify-between p-4 bg-slate-700/30 rounded-lg ${
                      isRTL() ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isRTL()
                          ? "flex-row-reverse space-x-reverse space-x-3"
                          : "space-x-3"
                      }`}
                    >
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        {activity.service_used === "cv-analysis" ? (
                          <FileSearch className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Search className="h-5 w-5 text-purple-400" />
                        )}
                      </div>
                      <div className={isRTL() ? "text-right" : ""}>
                        <p className="font-medium text-white">
                          {activity.service_used === "cv-analysis"
                            ? t("services.cv_analysis.title")
                            : t("services.talent_search.title")}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(activity.usage_date)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-red-400 font-semibold ${
                        isRTL() ? "text-left" : "text-right"
                      }`}
                    >
                      -{activity.credits_deducted} {t("credit.balance")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
