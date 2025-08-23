import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  adminService,
  type GetUsersParams,
  type UpdateUserData,
  type CreditGrantData,
} from "../services/adminService";

// مفاتيح الاستعلام للتخزين المؤقت
export const QUERY_KEYS = {
  users: "users",
  usersList: (params: GetUsersParams) => ["users", "list", params],
  dashboardStats: "dashboardStats",
} as const;

/**
 * Hook لجلب قائمة المستخدمين مع التصفية والبحث
 * @param params معاملات البحث والتصفية
 * @returns بيانات المستخدمين مع حالات التحميل والأخطاء
 */
export const useUsers = (params: GetUsersParams = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.usersList(params),
    queryFn: () => adminService.getUsers(params),
    enabled: true, // تفعيل الاستعلام تلقائياً
    staleTime: 2 * 60 * 1000, // بيانات الطلاب تتغير بسرعة، لذا استخدم 2 دقيقة فقط
  });
};

/**
 * Hook لتحديث بيانات مستخدم
 * @returns mutation function لتحديث المستخدم
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      updateData,
    }: {
      userId: string;
      updateData: UpdateUserData;
    }) => adminService.updateUser(userId, updateData),
    onSuccess: () => {
      // إعادة تحميل قائمة المستخدمين عند النجاح
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });

      // إظهار رسالة نجاح
      toast.success("تم تحديث بيانات المستخدم بنجاح");

      // تسجيل النشاط
      adminService.logAdminActivity("update_user", "user");
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث المستخدم:", error);
      toast.error(error.message || "فشل في تحديث بيانات المستخدم");
    },
  });
};

/**
 * Hook لإيقاف أو تفعيل مستخدم
 * @returns mutation function لإيقاف/تفعيل المستخدم
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      suspend,
      reason,
    }: {
      userId: string;
      suspend: boolean;
      reason?: string;
    }) => adminService.suspendUser(userId, suspend, reason),
    onSuccess: (_, variables) => {
      // إعادة تحميل قائمة المستخدمين
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });

      // إظهار رسالة نجاح
      toast.success(
        variables.suspend
          ? "تم إيقاف المستخدم بنجاح"
          : "تم تفعيل المستخدم بنجاح"
      );

      // تسجيل النشاط
      adminService.logAdminActivity(
        variables.suspend ? "suspend_user" : "activate_user",
        "user",
        variables.userId
      );
    },
    onError: (error: any) => {
      console.error("خطأ في تغيير حالة المستخدم:", error);
      toast.error(error.message || "فشل في تغيير حالة المستخدم");
    },
  });
};

/**
 * Hook لإدارة كريدت المستخدمين (منح أو خصم)
 * @returns mutation function لإدارة الكريدت
 */
export const useManageCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (creditData: CreditGrantData) =>
      adminService.manageCredits(creditData),
    onSuccess: (_, variables) => {
      // إعادة تحميل قائمة المستخدمين لتحديث أرصدة الكريدت
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });

      // إظهار رسالة نجاح
      toast.success(
        variables.type === "grant"
          ? `تم منح ${variables.amount} كريدت بنجاح`
          : `تم خصم ${variables.amount} كريدت بنجاح`
      );

      // تسجيل النشاط
      adminService.logAdminActivity(
        `${variables.type}_credits`,
        "user",
        variables.userId,
        { amount: variables.amount, reason: variables.reason }
      );
    },
    onError: (error: any) => {
      console.error("خطأ في إدارة الكريدت:", error);
      toast.error(error.message || "فشل في إدارة الكريدت");
    },
  });
};

/**
 * Hook لجلب إحصائيات لوحة التحكم
 * @returns بيانات الإحصائيات مع حالات التحميل والأخطاء
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboardStats],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // الإحصائيات لا تتغير بسرعة
    refetchInterval: 10 * 60 * 1000, // إعادة تحميل كل 10 دقائق
  });
};

/**
 * Hook للتحقق من الصلاحيات الإدارية
 * @param requiredRole الدور المطلوب
 * @returns حالة الصلاحية
 */
export const useAdminPermission = (requiredRole: string = "admin") => {
  return useQuery({
    queryKey: ["adminPermission", requiredRole],
    queryFn: () => adminService.checkAdminPermission(requiredRole),
    staleTime: 15 * 60 * 1000, // الصلاحيات لا تتغير كثيراً
    retry: 1,
  });
};

/**
 * Hook مساعد لإعادة تحميل بيانات المستخدمين يدوياً
 * @param params معاملات البحث الحالية
 * @returns دالة إعادة التحميل
 */
export const useRefreshUsers = (params: GetUsersParams = {}) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usersList(params) });
  };
};

/**
 * Hook لمسح ذاكرة التخزين المؤقت للمستخدمين
 * مفيد عند تسجيل الخروج أو تغيير المستخدم
 */
export const useClearUsersCache = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.users] });
  };
};
