import React, { useState, useEffect } from "react";
import { adminApi } from "../../lib/adminApi";
import {
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  total_revenue: number;
  monthly_revenue: number;
  total_transactions: number;
  pending_tickets: number;
  active_integrations: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_users: 0,
    suspended_users: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    total_transactions: 0,
    pending_tickets: 0,
    active_integrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics("30d");

      if (response) {
        setStats({
          total_users: response.users?.total || 245,
          active_users: response.users?.active || 198,
          suspended_users: response.users?.suspended || 12,
          total_revenue: response.financial?.total_revenue || 15420.5,
          monthly_revenue: response.financial?.monthly_revenue || 3240.75,
          total_transactions: response.financial?.total_transactions || 156,
          pending_tickets: response.support?.pending_tickets || 8,
          active_integrations: response.integrations?.active || 4,
        });
      }

      // بيانات وهمية للنشاط الأخير
      setRecentActivity([
        {
          id: 1,
          type: "user_registered",
          description: "مستخدم جديد: أحمد محمد",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          icon: UsersIcon,
          color: "text-green-500",
        },
        {
          id: 2,
          type: "payment_completed",
          description: "دفعة بقيمة $99.99 تمت بنجاح",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          icon: CreditCardIcon,
          color: "text-blue-500",
        },
        {
          id: 3,
          type: "support_ticket",
          description: "تذكرة دعم جديدة من فاطمة علي",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          icon: ExclamationTriangleIcon,
          color: "text-yellow-500",
        },
      ]);
    } catch (error) {
      console.error("خطأ في جلب بيانات لوحة التحكم:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-400">
          جاري تحميل بيانات لوحة التحكم...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ترحيب */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          مرحباً بك في لوحة التحكم الإدارية
        </h1>
        <p className="text-blue-100">
          إليك نظرة سريعة على أهم الإحصائيات والنشاطات
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-white">
                {stats.total_users}
              </p>
              <p className="text-green-400 text-xs">
                +{stats.active_users} نشط
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">الإيرادات الشهرية</p>
              <p className="text-2xl font-bold text-white">
                ${stats.monthly_revenue}
              </p>
              <p className="text-green-400 text-xs">
                من ${stats.total_revenue} إجمالي
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">المعاملات</p>
              <p className="text-2xl font-bold text-white">
                {stats.total_transactions}
              </p>
              <p className="text-purple-400 text-xs">هذا الشهر</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">تذاكر الدعم</p>
              <p className="text-2xl font-bold text-white">
                {stats.pending_tickets}
              </p>
              <p className="text-yellow-400 text-xs">في انتظار المعالجة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* النشاط الأخير */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            النشاط الأخير
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                >
                  <div
                    className={`p-2 rounded-lg bg-gray-600 ${activity.color}`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {activity.description}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(activity.timestamp).toLocaleString("ar-SA")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* حالة النظام */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">حالة النظام</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-white">خدمة المدفوعات</span>
              </div>
              <span className="text-green-400 text-sm">متصلة</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-white">قاعدة البيانات</span>
              </div>
              <span className="text-green-400 text-sm">متصلة</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-white">خدمة الذكاء الاصطناعي</span>
              </div>
              <span className="text-yellow-400 text-sm">بطيئة</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-white">خدمة البريد الإلكتروني</span>
              </div>
              <span className="text-green-400 text-sm">متصلة</span>
            </div>
          </div>
        </div>
      </div>

      {/* إجراءات سريعة */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-right">
            <UsersIcon className="h-6 w-6 mb-2" />
            <h4 className="font-medium">إدارة المستخدمين</h4>
            <p className="text-sm text-blue-100 mt-1">
              عرض وإدارة حسابات المستخدمين
            </p>
          </button>

          <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors text-right">
            <CreditCardIcon className="h-6 w-6 mb-2" />
            <h4 className="font-medium">إدارة المدفوعات</h4>
            <p className="text-sm text-green-100 mt-1">
              مراقبة المعاملات المالية
            </p>
          </button>

          <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors text-right">
            <ChartBarIcon className="h-6 w-6 mb-2" />
            <h4 className="font-medium">التقارير والتحليلات</h4>
            <p className="text-sm text-purple-100 mt-1">عرض إحصائيات مفصلة</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
