import { supabase } from "./supabase";

// أنواع البيانات للنظام الإداري
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_suspended: boolean;
  created_at: string;
  last_login: string | null;
  login_count: number;
  suspension_reason?: string;
}

export interface AdminTransaction {
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
  admin?: {
    full_name: string;
    email: string;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

export interface AdminLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
}

class AdminApiService {
  private maxRetries = 3;
  private retryDelay = 1000;

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`محاولة ${attempt} فشلت:`, error);

        if (attempt < this.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError;
  }

  // جلب قائمة المستخدمين
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: "active" | "suspended";
    } = {}
  ) {
    return this.withRetry(async () => {
      try {
        // Use Edge Function (now deployed)

        // بناء URL parameters
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            (typeof value === "boolean" || value !== "")
          ) {
            searchParams.append(key, value.toString());
          }
        });

        const queryString = searchParams.toString();
        const functionUrl = `admin-get-users${
          queryString ? "?" + queryString : ""
        }`;

        const { data, error } = await supabase.functions.invoke(functionUrl);

        if (error) {
          console.error("خطأ في جلب المستخدمين:", error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error("خطأ في جلب المستخدمين:", error);
        throw error;
      }
    });
  }

  // تحديث بيانات المستخدم
  async updateUser(userId: string, updateData: Partial<AdminUser>) {
    const { data, error } = await supabase.functions.invoke(
      "admin-update-user",
      {
        body: { userId, updateData },
      }
    );

    if (error) throw error;
    return data;
  }

  // إيقاف/تفعيل المستخدم
  async suspendUser(userId: string, suspend: boolean, reason?: string) {
    const { data, error } = await supabase.functions.invoke(
      "admin-suspend-user",
      {
        body: { userId, suspend, reason },
      }
    );

    if (error) throw error;
    return data;
  }

  // منح/خصم الأرصدة
  async grantCredits(userId: string, amount: number, reason: string) {
    const { data, error } = await supabase.functions.invoke(
      "admin-grant-credits",
      {
        body: { userId, amount, reason },
      }
    );

    if (error) throw error;
    return data;
  }

  // جلب الإحصائيات والتحليلات
  async getAnalytics(timeframe: "7d" | "30d" | "90d" | "all" = "30d") {
    return this.withRetry(async () => {
      try {
        // Use Edge Function (now deployed)

        const { data, error } = await supabase.functions.invoke(
          "admin-get-analytics",
          {
            body: {
              type: "dashboard_summary",
              timeframe,
            },
          }
        );

        if (error) {
          console.error("خطأ في جلب التحليلات:", error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error("خطأ في جلب التحليلات:", error);
        throw error;
      }
    });
  }

  // جلب المعاملات المالية
  async getTransactions(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    return this.withRetry(async () => {
      // بناء URL parameters
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          (typeof value === "boolean" || value !== "")
        ) {
          searchParams.append(key, value.toString());
        }
      });

      const queryString = searchParams.toString();
      const functionUrl = `admin-get-transactions${
        queryString ? "?" + queryString : ""
      }`;

      const { data, error } = await supabase.functions.invoke(functionUrl);

      if (error) {
        console.error("خطأ في جلب المعاملات:", error);
        throw error;
      }
      return data;
    });
  }

  // إدارة تذاكر الدعم
  async getTickets(
    params: {
      page?: number;
      limit?: number;
      filters?: {
        status?: string;
        priority?: string;
        assigned_to?: string;
      };
    } = {}
  ) {
    const { data, error } = await supabase.functions.invoke(
      "admin-manage-tickets",
      {
        body: { action: "list", ...params },
      }
    );

    if (error) throw error;
    return data;
  }

  // تحديث تذكرة الدعم
  async updateTicket(ticketId: string, updateData: Partial<SupportTicket>) {
    const { data, error } = await supabase.functions.invoke(
      "admin-manage-tickets",
      {
        body: { action: "update", ticketId, updateData },
      }
    );

    if (error) throw error;
    return data;
  }

  // الرد على تذكرة الدعم
  async respondToTicket(
    ticketId: string,
    responseData: {
      message: string;
      is_internal?: boolean;
      attachments?: any;
      updateStatus?: string;
    }
  ) {
    const { data, error } = await supabase.functions.invoke(
      "admin-manage-tickets",
      {
        body: { action: "respond", ticketId, responseData },
      }
    );

    if (error) throw error;
    return data;
  }

  // جلب سجلات النظام
  async getLogs(
    params: {
      page?: number;
      limit?: number;
      action?: string;
      adminUserId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const { data, error } = await supabase.functions.invoke("admin-get-logs", {
      body: params,
    });

    if (error) throw error;
    return data;
  }

  // فحص صحة APIs
  async checkApiHealth(
    action: "check_all" | "check_single",
    serviceId?: string
  ) {
    const { data, error } = await supabase.functions.invoke(
      "admin-api-health",
      {
        body: { action, serviceId },
      }
    );

    if (error) throw error;
    return data;
  }

  // جلب قائمة الأدوار مع الإحصائيات
  async getRoles(
    params: {
      includePermissions?: boolean;
      activeOnly?: boolean;
    } = {}
  ) {
    return this.withRetry(async () => {
      try {
        // Use Edge Function (now deployed)

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            (typeof value === "boolean" || value !== "")
          ) {
            searchParams.append(key, value.toString());
          }
        });

        const queryString = searchParams.toString();
        const functionUrl = `admin-get-roles${
          queryString ? "?" + queryString : ""
        }`;

        const { data, error } = await supabase.functions.invoke(functionUrl);

        if (error) {
          console.error("خطأ في جلب الأدوار:", error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error("خطأ في جلب الأدوار:", error);
        // Return mock data on error
        return {
          roles: [
            {
              id: 1,
              name: "user",
              display_name: "User",
              description: "Regular user",
              level: 1,
              is_active: true,
            },
            {
              id: 2,
              name: "admin",
              display_name: "Administrator",
              description: "System administrator",
              level: 10,
              is_active: true,
            },
            {
              id: 3,
              name: "super_admin",
              display_name: "Super Administrator",
              description: "Super administrator",
              level: 100,
              is_active: true,
            },
          ],
          total: 3,
        };
      }
    });
  }

  // تعيين دور للمستخدم
  async assignRole(userId: string, newRole: string, reason?: string) {
    return this.withRetry(async () => {
      const { data, error } = await supabase.functions.invoke(
        "admin-manage-roles",
        {
          body: {
            action: "assign_role",
            userId,
            newRole,
            reason,
          },
        }
      );

      if (error) {
        console.error("خطأ في تعيين الدور:", error);
        throw error;
      }
      return data;
    });
  }

  // التحقق من صلاحيات المستخدم
  async checkPermissions(params: {
    permissions?: Array<{ name: string; resource: string; action: string }>;
    resource?: string;
    action?: string;
  }) {
    return this.withRetry(async () => {
      const { data, error } = await supabase.functions.invoke(
        "admin-check-permissions",
        {
          body: params,
        }
      );

      if (error) {
        console.error("خطأ في التحقق من الصلاحيات:", error);
        throw error;
      }
      return data;
    });
  }

  // إنشاء مشرف جديد
  async createAdminUser(
    email: string,
    password: string,
    fullName: string,
    role: string = "admin"
  ): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await supabase.functions.invoke(
        "create-admin-user",
        {
          body: {
            email,
            password,
            full_name: fullName,
            role,
          },
        }
      );

      if (error) {
        console.error("خطأ في إنشاء المشرف:", error);
        throw error;
      }
      return data;
    });
  }

  // إدارة تكوينات API
  async getApiConfigurations(): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from("api_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    });
  }

  async updateApiConfiguration(
    id: string,
    updates: {
      service_name?: string;
      endpoint_url?: string;
      api_key_encrypted?: string;
      headers?: any;
      is_active?: boolean;
    }
  ): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from("api_configurations")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  async createApiConfiguration(config: {
    service_name: string;
    endpoint_url: string;
    api_key_encrypted?: string;
    headers?: any;
    is_active?: boolean;
  }): Promise<any> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from("api_configurations")
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }
}

export const adminApi = new AdminApiService();
