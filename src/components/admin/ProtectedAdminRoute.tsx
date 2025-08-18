import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  requiredRole = "admin",
}) => {
  const { user, profile, loading } = useAuth();

  // عرض مؤشر التحميل أثناء فحص المصادقة
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-white">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  // إعادة التوجيه لصفحة تسجيل الدخول إذا لم يكن المستخدم مسجل الدخول
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // التحقق من الدور المطلوب
  const hasRequiredRole =
    profile?.role === "admin" ||
    profile?.role === "super_admin" ||
    profile?.is_admin ||
    profile?.role === requiredRole;

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">غير مخول</h1>
          <p className="text-gray-400 mb-4">
            ليس لديك صلاحية للوصول إلى هذه الصفحة
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
