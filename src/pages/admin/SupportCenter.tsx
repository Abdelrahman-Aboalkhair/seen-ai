import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "../../lib/adminApi";
import {
  LifebuoyIcon,
  ChatBubbleBottomCenterTextIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

const SupportCenter: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      // بيانات وهمية لتذاكر الدعم
      const mockTickets: SupportTicket[] = [
        {
          id: "1",
          user_id: "user1",
          title: "مشكلة في تسجيل الدخول",
          description: "لا أستطيع تسجيل الدخول إلى حسابي، أحصل على رسالة خطأ",
          priority: "high",
          status: "open",
          created_at: "2024-01-09T10:30:00Z",
          user: {
            full_name: "أحمد محمد",
            email: "ahmed@example.com",
          },
        },
        {
          id: "2",
          user_id: "user2",
          title: "استفسار حول الباقات",
          description: "أريد معرفة الفرق بين الباقات المختلفة والأسعار",
          priority: "medium",
          status: "in_progress",
          created_at: "2024-01-09T09:15:00Z",
          user: {
            full_name: "فاطمة علي",
            email: "fatema@example.com",
          },
        },
        {
          id: "3",
          user_id: "user3",
          title: "طلب استرداد",
          description: "أريد استرداد المبلغ المدفوع للباقة الشهرية",
          priority: "urgent",
          status: "open",
          created_at: "2024-01-09T08:45:00Z",
          user: {
            full_name: "خالد أحمد",
            email: "khalid@example.com",
          },
        },
      ];

      let filteredTickets = mockTickets;

      if (statusFilter) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.status === statusFilter
        );
      }

      if (priorityFilter) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.priority === priorityFilter
        );
      }

      setTickets(filteredTickets);
    } catch (error) {
      console.error("خطأ في جلب تذاكر الدعم:", error);
      toast.error("فشل في جلب قائمة تذاكر الدعم");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: string,
    newStatus: string
  ) => {
    try {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus as any }
            : ticket
        )
      );

      toast.success("تم تحديث حالة التذكرة بنجاح");
    } catch (error) {
      console.error("خطأ في تحديث حالة التذكرة:", error);
      toast.error("فشل في تحديث حالة التذكرة");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) {
      toast.error("يرجى كتابة رد على التذكرة");
      return;
    }

    try {
      // محاكاة إرسال الرد
      toast.success("تم إرسال الرد بنجاح");
      setResponseMessage("");
      setSelectedTicket(null);

      // تحديث حالة التذكرة إلى "قيد المعالجة"
      await handleUpdateTicketStatus(selectedTicket.id, "in_progress");
    } catch (error) {
      console.error("خطأ في إرسال الرد:", error);
      toast.error("فشل في إرسال الرد");
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "high":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "عاجل";
      case "high":
        return "عالي";
      case "medium":
        return "متوسط";
      case "low":
        return "منخفض";
      default:
        return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوحة";
      case "in_progress":
        return "قيد المعالجة";
      case "resolved":
        return "محلولة";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-400">جاري تحميل تذاكر الدعم...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مركز الدعم</h1>
          <p className="text-gray-400 mt-1">إدارة ومتابعة تذاكر الدعم الفني</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {tickets.filter((t) => t.status === "open").length} تذكرة مفتوحة
          </span>
        </div>
      </div>

      {/* شريط الفلاتر */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              فلترة بالحالة
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              فلترة بالأولوية
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأولويات</option>
              <option value="urgent">عاجل</option>
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTickets}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              تحديث القائمة
            </button>
          </div>
        </div>
      </div>

      {/* قائمة التذاكر */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  التذكرة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الأولوية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    <LifebuoyIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    لا توجد تذاكر دعم
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {ticket.title}
                        </div>
                        <div className="text-sm text-gray-400 mt-1 max-w-xs truncate">
                          {ticket.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="mr-3">
                          <div className="text-sm font-medium text-white">
                            {ticket.user?.full_name || "غير محدد"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {ticket.user?.email || "غير محدد"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(ticket.priority)}
                        <span className="text-sm text-gray-300">
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="الرد على التذكرة"
                        >
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                        </button>
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            handleUpdateTicketStatus(ticket.id, e.target.value)
                          }
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="open">مفتوحة</option>
                          <option value="in_progress">قيد المعالجة</option>
                          <option value="resolved">محلولة</option>
                          <option value="closed">مغلقة</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الرد على التذكرة */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-white mb-4">
              الرد على: {selectedTicket.title}
            </h3>

            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-white font-medium">
                  {selectedTicket.user?.full_name}
                </span>
                <span className="text-gray-400 text-sm">
                  {selectedTicket.user?.email}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                {selectedTicket.description}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ردك على التذكرة
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="اكتب ردك هنا..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setResponseMessage("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendResponse}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                إرسال الرد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportCenter;
