import React, { useState } from "react";
import { toast } from "sonner";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

interface SystemSettings {
  general: {
    site_name: string;
    site_description: string;
    support_email: string;
    max_file_size: number;
  };
  security: {
    enable_2fa: boolean;
    session_timeout: number;
    max_login_attempts: number;
    password_min_length: number;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
  };
  payments: {
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    currency: string;
    tax_rate: number;
  };
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      site_name: "SEEN AI HR",
      site_description: "نظام ذكي لإدارة الموارد البشرية",
      support_email: "support@seenai.com",
      max_file_size: 10,
    },
    security: {
      enable_2fa: true,
      session_timeout: 30,
      max_login_attempts: 5,
      password_min_length: 8,
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
    },
    payments: {
      stripe_enabled: true,
      paypal_enabled: false,
      currency: "USD",
      tax_rate: 15,
    },
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "security" | "notifications" | "payments"
  >("general");

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("خطأ في حفظ الإعدادات:", error);
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (
    category: keyof SystemSettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: "general", name: "عام", icon: Cog6ToothIcon },
    { id: "security", name: "الأمان", icon: ShieldCheckIcon },
    { id: "notifications", name: "الإشعارات", icon: BellIcon },
    { id: "payments", name: "المدفوعات", icon: CreditCardIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إعدادات النظام</h1>
        <p className="text-gray-400 mt-1">إدارة وتخصيص إعدادات النظام العامة</p>
      </div>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <IconComponent className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === "general" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">
              الإعدادات العامة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم الموقع
                </label>
                <input
                  type="text"
                  value={settings.general.site_name}
                  onChange={(e) =>
                    updateSetting("general", "site_name", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  بريد الدعم
                </label>
                <input
                  type="email"
                  value={settings.general.support_email}
                  onChange={(e) =>
                    updateSetting("general", "support_email", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">
              إعدادات الأمان
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">
                    التحقق الثنائي
                  </label>
                  <p className="text-xs text-gray-400">
                    تفعيل التحقق الثنائي لجميع المستخدمين
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enable_2fa}
                    onChange={(e) =>
                      updateSetting("security", "enable_2fa", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">
              إعدادات الإشعارات
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">
                    إشعارات البريد الإلكتروني
                  </label>
                  <p className="text-xs text-gray-400">
                    إرسال إشعارات عبر البريد الإلكتروني
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email_notifications}
                    onChange={(e) =>
                      updateSetting(
                        "notifications",
                        "email_notifications",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">
              إعدادات المدفوعات
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">
                    تفعيل Stripe
                  </label>
                  <p className="text-xs text-gray-400">
                    تفعيل الدفع عبر Stripe
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payments.stripe_enabled}
                    onChange={(e) =>
                      updateSetting(
                        "payments",
                        "stripe_enabled",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
