import { supabase } from "../lib/supabase";

// أنواع البيانات الأساسية للنظام الإداري
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: Record<string, boolean>;
  is_suspended: boolean;
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "suspended" | "all";
  sortBy?: "created_at" | "last_login" | "full_name" | "email";
  sortOrder?: "asc" | "desc";
}

export interface GetUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: string;
  permissions?: Record<string, boolean>;
  is_suspended?: boolean;
  suspension_reason?: string;
}

export interface CreditGrantData {
  userId: string;
  amount: number;
  reason: string;
  type: "grant" | "deduct";
}

/**
 * خدمة إدارة المستخدمين في لوحة التحكم الإدارية
 * تتولى التفاعل مع Edge Functions الخاصة بالعمليات الإدارية
 */
class AdminService {
  /**
   * جلب قائمة المستخدمين مع إمكانيات البحث والتصفية والترتيب
   * @param params معاملات البحث والتصفية
   * @returns قائمة المستخدمين مع معلومات الصفحات
   */
  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    try {
      // تعيين القيم الافتراضية
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || "",
        role: params.role || "",
        status: params.status || "all",
        sortBy: params.sortBy || "created_at",
        sortOrder: params.sortOrder || "desc",
      };

      // TEMPORARY: Use direct database query instead of Edge Function
      // TODO: Deploy Edge Functions and restore original implementation

      let query = supabase.from("profiles").select("*");

      // Apply search filter
      if (queryParams.search) {
        query = query.or(
          `email.ilike.%${queryParams.search}%,full_name.ilike.%${queryParams.search}%`
        );
      }

      // Apply status filter
      if (queryParams.status === "active") {
        query = query.eq("is_suspended", false);
      } else if (queryParams.status === "suspended") {
        query = query.eq("is_suspended", true);
      }

      // Apply sorting
      query = query.order(queryParams.sortBy || "created_at", {
        ascending: queryParams.sortOrder === "asc",
      });

      // Apply pagination
      const from = (queryParams.page - 1) * queryParams.limit;
      const to = from + queryParams.limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("خطأ في جلب المستخدمين:", error);
        throw new Error(error.message || "فشل في جلب قائمة المستخدمين");
      }

      // Transform data to match expected format
      const users =
        data?.map((user) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role || "user",
          permissions: user.permissions || {},
          is_suspended: user.is_suspended || false,
          suspension_reason: user.suspension_reason,
          suspended_at: user.suspended_at,
          suspended_by: user.suspended_by,
          last_login: user.last_login,
          login_count: user.login_count || 0,
          created_at: user.created_at,
          updated_at: user.updated_at,
        })) || [];

      return {
        users,
        total: count || 0,
        page: queryParams.page,
        limit: queryParams.limit,
        totalPages: Math.ceil((count || 0) / queryParams.limit),
      };
    } catch (error) {
      console.error("خطأ في خدمة getUsers:", error);
      throw error;
    }
  }

  /**
   * تحديث بيانات مستخدم محدد
   * @param userId معرف المستخدم
   * @param updateData البيانات المراد تحديثها
   * @returns نتيجة عملية التحديث
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserData
  ): Promise<ApiResponse> {
    try {
      if (!userId || !updateData) {
        throw new Error("معرف المستخدم والبيانات المراد تحديثها مطلوبان");
      }

      const { data, error } = await supabase.functions.invoke(
        "admin-update-user",
        {
          body: {
            userId,
            updateData,
          },
        }
      );

      if (error) {
        console.error("خطأ في تحديث المستخدم:", error);
        throw new Error(error.message || "فشل في تحديث بيانات المستخدم");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "فشل في تحديث بيانات المستخدم");
      }

      return data;
    } catch (error) {
      console.error("خطأ في خدمة updateUser:", error);
      throw error;
    }
  }

  /**
   * إيقاف أو تفعيل حساب مستخدم
   * @param userId معرف المستخدم
   * @param suspend حالة الإيقاف (true للإيقاف، false للتفعيل)
   * @param reason سبب الإيقاف (مطلوب عند الإيقاف)
   * @returns نتيجة العملية
   */
  async suspendUser(
    userId: string,
    suspend: boolean,
    reason?: string
  ): Promise<ApiResponse> {
    try {
      if (!userId) {
        throw new Error("معرف المستخدم مطلوب");
      }

      if (suspend && !reason) {
        throw new Error("سبب الإيقاف مطلوب عند إيقاف الحساب");
      }

      const { data, error } = await supabase.functions.invoke(
        "admin-suspend-user",
        {
          body: {
            userId,
            suspend,
            reason: reason || null,
          },
        }
      );

      if (error) {
        console.error("خطأ في إيقاف/تفعيل المستخدم:", error);
        throw new Error(error.message || "فشل في تغيير حالة المستخدم");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "فشل في تغيير حالة المستخدم");
      }

      return data;
    } catch (error) {
      console.error("خطأ في خدمة suspendUser:", error);
      throw error;
    }
  }

  /**
   * منح أو خصم الكريدت من حساب المستخدم
   * @param creditData بيانات عملية الكريدت
   * @returns نتيجة العملية
   */
  async manageCredits(creditData: CreditGrantData): Promise<ApiResponse> {
    try {
      const { userId, amount, reason, type } = creditData;

      if (!userId || !amount || !reason || !type) {
        throw new Error("جميع بيانات عملية الكريدت مطلوبة");
      }

      if (amount <= 0) {
        throw new Error("مقدار الكريدت يجب أن يكون أكبر من صفر");
      }

      const { data, error } = await supabase.functions.invoke(
        "admin-grant-credits",
        {
          body: {
            userId,
            amount: type === "deduct" ? -amount : amount,
            reason,
            type,
          },
        }
      );

      if (error) {
        console.error("خطأ في إدارة الكريدت:", error);
        throw new Error(error.message || "فشل في إدارة كريدت المستخدم");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "فشل في إدارة كريدت المستخدم");
      }

      return data;
    } catch (error) {
      console.error("خطأ في خدمة manageCredits:", error);
      throw error;
    }
  }

  /**
   * التحقق من صلاحيات المستخدم الحالي للوصول للوظائف الإدارية
   * @param requiredRole الدور المطلوب
   * @returns true إذا كان المستخدم يملك الصلاحية
   */
  async checkAdminPermission(requiredRole: string = "admin"): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      // جلب ملف المستخدم الشخصي للتحقق من الصلاحيات
      // Use service role to bypass RLS issues
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions, is_suspended, is_admin")
        .eq("id", user.id)
        .single();

      if (!profile || profile.is_suspended) {
        return false;
      }

      // إذا كان المستخدم is_admin = true، يحق له الوصول لجميع الوظائف الإدارية
      if (profile.is_admin === true) {
        return true;
      }

      // التحقق من الدور
      const userRole = profile.role || "user";
      const adminRoles = [
        "super_admin",
        "admin",
        "finance_manager",
        "support_agent",
        "analyst",
      ];

      if (requiredRole === "any_admin") {
        return adminRoles.includes(userRole);
      }

      // للأدوار الأخرى، التحقق من الهرمية
      const roleHierarchy = {
        super_admin: 5,
        admin: 4,
        finance_manager: 3,
        support_agent: 2,
        analyst: 1,
        user: 0,
      };

      const userLevel =
        roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
      const requiredLevel =
        roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

      // المشرفون (admin) والمشرفون العامون (super_admin) يمكنهم الوصول لجميع الأقسام
      if (userRole === "admin" || userRole === "super_admin") {
        return true;
      }

      return userLevel >= requiredLevel;
    } catch (error) {
      console.error("خطأ في التحقق من الصلاحيات:", error);
      return false;
    }
  }

  /**
   * تسجيل نشاط إداري في سجل النظام
   * @param action نوع العملية
   * @param targetType نوع الهدف
   * @param targetId معرف الهدف
   * @param details تفاصيل إضافية
   */
  async logAdminActivity(
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    } catch (error) {
      console.error("خطأ في تسجيل النشاط الإداري:", error);
      // لا نرمي خطأ هنا لأن تسجيل النشاط لا يجب أن يوقف العملية الأساسية
    }
  }

  /**
   * جلب الإحصائيات السريعة للوحة التحكم
   * @returns الإحصائيات الأساسية
   */
  async getDashboardStats(): Promise<any> {
    try {
      // التحقق من الاتصال أولاً
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("المستخدم غير مصرح له");
      }

      const { data, error } = await supabase.functions.invoke(
        "admin-get-analytics",
        {
          body: {
            type: "dashboard_summary",
            timeframe: "30d",
          },
        }
      );

      if (error) {
        console.error("خطأ في جلب إحصائيات لوحة التحكم:", error);
        // إعادة محاولة مع معاملات مختلفة
        return await this.getFallbackStats();
      }

      if (!data || !data.success) {
        console.warn("البيانات المستلمة غير صالحة:", data);
        return await this.getFallbackStats();
      }

      return data.data;
    } catch (error) {
      console.error("خطأ في خدمة getDashboardStats:", error);
      return await this.getFallbackStats();
    }
  }

  /**
   * الحصول على إحصائيات افتراضية في حالة فشل الوظيفة الرئيسية
   */
  private async getFallbackStats(): Promise<any> {
    try {
      // محاولة جلب البيانات مباشرة من قاعدة البيانات
      const { data: profiles } = await supabase
        .from("profiles")
        .select("role, is_suspended, created_at")
        .limit(1000);

      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("credits_amount, transaction_type, created_at")
        .limit(100);

      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("status, priority, created_at")
        .limit(100)
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      return {
        users: {
          total: profiles?.length || 0,
          newUsers:
            profiles?.filter(
              (p) =>
                new Date(p.created_at) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length || 0,
          activeUsers: profiles?.filter((p) => !p.is_suspended).length || 0,
          suspendedUsers: profiles?.filter((p) => p.is_suspended).length || 0,
          roleDistribution:
            profiles?.reduce((acc, p) => {
              acc[p.role || "user"] = (acc[p.role || "user"] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {},
        },
        financial: {
          totalTransactions: transactions?.length || 0,
          totalRevenue:
            transactions
              ?.filter((t) => t.transaction_type === "purchase")
              .reduce((sum, t) => sum + (t.credits_amount || 0), 0) || 0,
          adminGrants:
            transactions
              ?.filter((t) => t.transaction_type === "admin_grant")
              .reduce((sum, t) => sum + (t.credits_amount || 0), 0) || 0,
          adminDeductions: Math.abs(
            transactions
              ?.filter((t) => t.transaction_type === "admin_deduct")
              .reduce((sum, t) => sum + (t.credits_amount || 0), 0) || 0
          ),
        },
        usage: {
          totalSearches: 0,
          completedSearches: 0,
          totalAnalyses: 0,
          completedAnalyses: 0,
          creditsSpent: 0,
        },
        support: {
          totalTickets: tickets?.length || 0,
          openTickets: tickets?.filter((t) => t.status === "open").length || 0,
          inProgressTickets:
            tickets?.filter((t) => t.status === "in_progress").length || 0,
          resolvedTickets:
            tickets?.filter((t) => t.status === "resolved").length || 0,
          urgentTickets:
            tickets?.filter((t) => t.priority === "urgent").length || 0,
        },
      };
    } catch (fallbackError) {
      console.error("خطأ في جلب البيانات الاحتياطية:", fallbackError);
      // إرجاع بيانات فارغة كحل أخير
      return {
        users: {
          total: 0,
          newUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          roleDistribution: {},
        },
        financial: {
          totalTransactions: 0,
          totalRevenue: 0,
          adminGrants: 0,
          adminDeductions: 0,
        },
        usage: {
          totalSearches: 0,
          completedSearches: 0,
          totalAnalyses: 0,
          completedAnalyses: 0,
          creditsSpent: 0,
        },
        support: {
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          urgentTickets: 0,
        },
      };
    }
  }
}

// إنشاء مثيل واحد من الخدمة لاستخدامه في جميع أنحاء التطبيق
export const adminService = new AdminService();

// تصدير الدوال المطلوبة للاستخدام المباشر
export const checkAdminPermission = (
  requiredRole: string = "admin"
): Promise<boolean> => {
  return adminService.checkAdminPermission(requiredRole);
};

export const logAdminActivity = (
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
): Promise<void> => {
  return adminService.logAdminActivity(action, targetType, targetId, details);
};

// لا حاجة لإعادة تصدير الأنواع لأنها تم تصديرها بالفعل في الأعلى
