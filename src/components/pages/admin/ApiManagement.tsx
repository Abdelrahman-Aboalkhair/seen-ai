import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "../../../lib/adminApi";
import {
  CpuChipIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface ApiIntegration {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  api_key: string;
  endpoint: string;
  description?: string;
  last_checked?: string;
  created_at: string;
}

interface ApiHealth {
  service: string;
  status: "healthy" | "unhealthy" | "unknown";
  response_time?: number;
  last_check: string;
  error_message?: string;
}

const ApiManagement: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [healthStatus, setHealthStatus] = useState<ApiHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<ApiIntegration | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    api_key: "",
    endpoint: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadIntegrations(), checkApiHealth()]);
    setLoading(false);
  };

  const loadIntegrations = async () => {
    try {
      // جلب التكاملات من قاعدة البيانات
      const apiConfigs = await adminApi.getApiConfigurations();

      if (apiConfigs && apiConfigs.length > 0) {
        const integrations: ApiIntegration[] = apiConfigs.map(
          (config: any) => ({
            id: config.id,
            name: config.service_name,
            type: getServiceType(config.service_name),
            status: config.is_active ? "active" : "inactive",
            api_key: config.api_key_encrypted
              ? "***" + config.api_key_encrypted.slice(-4)
              : "غير محدد",
            endpoint: config.endpoint_url,
            description: getServiceDescription(config.service_name),
            last_checked: config.last_tested || new Date().toISOString(),
            created_at: config.created_at,
          })
        );
        setIntegrations(integrations);
      } else {
        // إذا لم تكن هناك تكاملات، اعرض رسالة
        setIntegrations([]);
      }
    } catch (error) {
      console.error("خطأ في جلب التكاملات:", error);
      toast.error("فشل في جلب قائمة التكاملات");
      setIntegrations([]);
    }
  };

  const getServiceType = (serviceName: string): string => {
    const serviceMap: Record<string, string> = {
      OpenAI: "ai",
      Stripe: "payment",
      SendGrid: "email",
      Twilio: "sms",
      AWS: "cloud",
    };
    return serviceMap[serviceName] || "other";
  };

  const getServiceDescription = (serviceName: string): string => {
    const descriptionMap: Record<string, string> = {
      OpenAI: "خدمة الذكاء الاصطناعي لتحليل السير الذاتية",
      Stripe: "معالج الدفعات الرئيسي",
      SendGrid: "خدمة إرسال البريد الإلكتروني",
      Twilio: "خدمة الرسائل النصية",
      AWS: "خدمات السحابة الإلكترونية",
    };
    return descriptionMap[serviceName] || "خدمة خارجية";
  };

  const testOpenAI = async (apiKey: string) => {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("OpenAI API يعمل بشكل صحيح");
        return true;
      } else {
        const errorData = await response.json();
        toast.error(
          `خطأ في OpenAI API: ${errorData.error?.message || "خطأ غير معروف"}`
        );
        return false;
      }
    } catch (error) {
      toast.error("فشل في الاتصال بـ OpenAI API");
      return false;
    }
  };

  const checkApiHealth = async () => {
    try {
      const response = await adminApi.checkApiHealth("check_all");
      if (response && response.healthChecks) {
        setHealthStatus(response.healthChecks);
      } else {
        // إذا لم تكن هناك بيانات صحية، اعرض رسالة
        setHealthStatus([]);
      }
    } catch (error) {
      console.error("خطأ في فحص صحة APIs:", error);
      setHealthStatus([]);
    }
  };

  const handleAddIntegration = async () => {
    if (
      !formData.name ||
      !formData.type ||
      !formData.api_key ||
      !formData.endpoint
    ) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      // اختبار OpenAI API إذا كان هو المطلوب إضافته
      if (formData.name === "OpenAI") {
        const isValid = await testOpenAI(formData.api_key);
        if (!isValid) {
          return; // لا تتابع إذا فشل الاختبار
        }
      }

      // إنشاء تكوين API جديد في قاعدة البيانات
      const newConfig = await adminApi.createApiConfiguration({
        service_name: formData.name,
        endpoint_url: formData.endpoint,
        api_key_encrypted: formData.api_key, // في التطبيق الحقيقي، يجب تشفير المفتاح
        headers: { "Content-Type": "application/json" },
        is_active: true,
      });

      // إعادة تحميل التكاملات
      await loadIntegrations();
      setShowAddModal(false);
      resetForm();
      toast.success("تم إضافة التكامل بنجاح");
    } catch (error) {
      console.error("خطأ في إضافة التكامل:", error);
      toast.error("فشل في إضافة التكامل");
    }
  };

  const handleEditIntegration = async () => {
    if (
      !selectedIntegration ||
      !formData.name ||
      !formData.type ||
      !formData.api_key ||
      !formData.endpoint
    ) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === selectedIntegration.id
            ? { ...integration, ...formData }
            : integration
        )
      );

      setShowEditModal(false);
      setSelectedIntegration(null);
      resetForm();
      toast.success("تم تحديث التكامل بنجاح");
    } catch (error) {
      console.error("خطأ في تحديث التكامل:", error);
      toast.error("فشل في تحديث التكامل");
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التكامل؟")) {
      return;
    }

    try {
      setIntegrations((prev) =>
        prev.filter((integration) => integration.id !== id)
      );
      toast.success("تم حذف التكامل بنجاح");
    } catch (error) {
      console.error("خطأ في حذف التكامل:", error);
      toast.error("فشل في حذف التكامل");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      api_key: "",
      endpoint: "",
      description: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "healthy":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
      case "unhealthy":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "inactive":
      case "unknown":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
      case "healthy":
        return "نشط";
      case "error":
      case "unhealthy":
        return "خطأ";
      case "inactive":
        return "غير نشط";
      case "unknown":
        return "غير معروف";
      default:
        return status;
    }
  };

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return "***";
    return apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-400">جاري تحميل التكاملات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة التكاملات</h1>
          <p className="text-gray-400 mt-1">إدارة ومراقبة جميع تكاملات API</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={checkApiHealth}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            فحص الحالة
          </button>
          <button
            onClick={() => {
              setFormData({
                name: "OpenAI",
                type: "ai",
                api_key: "",
                endpoint: "https://api.openai.com/v1",
                description: "خدمة الذكاء الاصطناعي لتحليل السير الذاتية",
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            إعداد OpenAI
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            إضافة تكامل
          </button>
        </div>
      </div>

      {/* حالة APIs */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">حالة الخدمات</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthStatus.map((health, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{health.service}</span>
                {getStatusIcon(health.status)}
              </div>
              <div className="text-sm text-gray-400">
                <p>الحالة: {getStatusText(health.status)}</p>
                {health.response_time && (
                  <p>زمن الاستجابة: {health.response_time}ms</p>
                )}
                {health.error_message && (
                  <p className="text-red-400 mt-1">{health.error_message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* جدول التكاملات */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  التكامل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  مفتاح API
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  آخر فحص
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {integrations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    <CpuChipIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    لا توجد تكاملات
                  </td>
                </tr>
              ) : (
                integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {integration.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {integration.description || "بدون وصف"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {integration.type === "payment"
                          ? "دفع"
                          : integration.type === "email"
                          ? "بريد إلكتروني"
                          : integration.type === "ai"
                          ? "ذكاء اصطناعي"
                          : integration.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300 font-mono">
                          {showApiKeys[integration.id]
                            ? integration.api_key
                            : maskApiKey(integration.api_key)}
                        </span>
                        <button
                          onClick={() => toggleApiKeyVisibility(integration.id)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          {showApiKeys[integration.id] ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className="text-sm text-gray-300">
                          {getStatusText(integration.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {integration.last_checked
                        ? new Date(integration.last_checked).toLocaleDateString(
                            "ar-SA"
                          )
                        : "لم يتم الفحص"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setFormData({
                              name: integration.name,
                              type: integration.type,
                              api_key: integration.api_key,
                              endpoint: integration.endpoint,
                              description: integration.description || "",
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="تعديل"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteIntegration(integration.id)
                          }
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="حذف"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة تكامل */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              إضافة تكامل جديد
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم التكامل
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثل: Stripe Payment Gateway"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  النوع
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر النوع</option>
                  <option value="payment">دفع</option>
                  <option value="email">بريد إلكتروني</option>
                  <option value="ai">ذكاء اصطناعي</option>
                  <option value="storage">تخزين</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  مفتاح API
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      api_key: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل مفتاح API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  نقطة النهاية
                </label>
                <input
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endpoint: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف قصير للتكامل"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddIntegration}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                إضافة التكامل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل تكامل */}
      {showEditModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              تعديل التكامل
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم التكامل
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  النوع
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="payment">دفع</option>
                  <option value="email">بريد إلكتروني</option>
                  <option value="ai">ذكاء اصطناعي</option>
                  <option value="storage">تخزين</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  مفتاح API
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      api_key: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  نقطة النهاية
                </label>
                <input
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endpoint: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedIntegration(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditIntegration}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement;
