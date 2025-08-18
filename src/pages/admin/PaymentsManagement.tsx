import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "../../lib/adminApi";
import {
  CreditCardIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface PaymentStats {
  total_revenue: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
}

const PaymentsManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_revenue: 0,
    total_transactions: 0,
    successful_payments: 0,
    failed_payments: 0,
    pending_payments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [currentPage, statusFilter, typeFilter, dateRange]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTransactions({
        page: currentPage,
        limit: 20,
        status: statusFilter,
        type: typeFilter,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      setTransactions(response.transactions || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("خطأ في جلب المعاملات:", error);
      toast.error("فشل في جلب قائمة المعاملات");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminApi.getAnalytics("30d");
      console.log("Analytics response:", response); // للتشخيص

      if (response && response.data && response.data.financial) {
        const financial = response.data.financial;
        setStats({
          total_revenue: financial.totalRevenue || 0,
          total_transactions: financial.totalTransactions || 0,
          successful_payments: financial.totalTransactions || 0, // يمكن حسابها من المعاملات
          failed_payments: 0,
          pending_payments: 0,
        });
      } else {
        // استخدام بيانات احتياطية
        console.warn("لم يتم الحصول على بيانات مالية من API");
        setStats({
          total_revenue: 0,
          total_transactions: 0,
          successful_payments: 0,
          failed_payments: 0,
          pending_payments: 0,
        });
      }
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
      // في حالة الخطأ، وضع قيم فارغة
      setStats({
        total_revenue: 0,
        total_transactions: 0,
        successful_payments: 0,
        failed_payments: 0,
        pending_payments: 0,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "pending":
      case "processing":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "مكتملة";
      case "failed":
      case "error":
        return "فشلت";
      case "pending":
      case "processing":
        return "قيد المعالجة";
      default:
        return status;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.user?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-400">جاري تحميل المعاملات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المدفوعات</h1>
          <p className="text-gray-400 mt-1">
            مراقبة وإدارة جميع المعاملات المالية
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          onClick={() => toast.info("قريباً: تصدير التقارير")}
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          تصدير التقرير
        </button>
      </div>

      {/* إحصائيات المدفوعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-white">
                ${stats.total_revenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">إجمالي المعاملات</p>
              <p className="text-2xl font-bold text-white">
                {stats.total_transactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">معاملات ناجحة</p>
              <p className="text-2xl font-bold text-white">
                {stats.successful_payments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">معاملات فاشلة</p>
              <p className="text-2xl font-bold text-white">
                {stats.failed_payments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="mr-4">
              <p className="text-gray-400 text-sm">معاملات معلقة</p>
              <p className="text-2xl font-bold text-white">
                {stats.pending_payments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="البحث بالمستخدم أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="completed">مكتملة</option>
              <option value="pending">معلقة</option>
              <option value="failed">فاشلة</option>
            </select>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              <option value="payment">دفعة</option>
              <option value="refund">استرداد</option>
              <option value="credit">إضافة رصيد</option>
            </select>
          </div>
          <div>
            <button
              onClick={loadTransactions}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المعاملة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    <CreditCardIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    لا توجد معاملات
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {transaction.id.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.description || "بدون وصف"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {transaction.user?.full_name || "غير محدد"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.user?.email || "غير محدد"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          transaction.amount > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {transaction.type === "payment"
                          ? "دفعة"
                          : transaction.type === "refund"
                          ? "استرداد"
                          : transaction.type === "credit"
                          ? "رصيد"
                          : transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm text-gray-300">
                          {getStatusText(transaction.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString(
                        "ar-SA"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* التصفح */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            عرض الصفحة {currentPage} من {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              السابق
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;
