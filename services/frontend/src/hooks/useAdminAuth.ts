import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface AdminProfile {
  id: string;
  role: string;
  permissions: any;
  full_name: string;
  email: string;
}

export function useAdminAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAdminProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, permissions, full_name, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        // التحقق من أن المستخدم له صلاحيات إدارية
        const adminRoles = [
          "super_admin",
          "admin",
          "finance_manager",
          "support_agent",
          "analyst",
        ];
        setIsAdmin(adminRoles.includes(data.role));
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات المشرف:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchAdminProfile();
  }, [user, fetchAdminProfile]);

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;

    // المشرف العام له جميع الصلاحيات
    if (profile.role === "super_admin") return true;

    // التحقق من الصلاحيات حسب الدور
    const rolePermissions = {
      admin: [
        "users.read",
        "users.write",
        "tickets.read",
        "tickets.write",
        "logs.read",
      ],
      finance_manager: [
        "transactions.read",
        "transactions.write",
        "analytics.read",
        "reports.read",
      ],
      support_agent: ["tickets.read", "tickets.write"],
      analyst: ["analytics.read", "reports.read", "logs.read"],
    };

    const permissions =
      rolePermissions[profile.role as keyof typeof rolePermissions] || [];
    return permissions.includes(permission);
  };

  const redirectToLogin = () => {
    navigate("/login?redirect=/admin");
  };

  const redirectToUnauthorized = () => {
    navigate("/dashboard");
  };

  return {
    user,
    profile,
    loading,
    isAdmin,
    hasPermission,
    redirectToLogin,
    redirectToUnauthorized,
  };
}
