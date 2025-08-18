import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { checkAdminPermission } from "../../services/adminService";
import { UserCheck2 } from "lucide-react";

interface AdminNavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  requiredRole?:
    | "super_admin"
    | "admin"
    | "finance_manager"
    | "support_agent"
    | "analyst";
  badge?: number;
}

const AdminNavLink: React.FC<AdminNavLinkProps> = ({
  to,
  icon,
  label,
  requiredRole = "admin",
  badge,
}) => {
  const { user } = useAuth();
  console.log("🔍 AdminNavLink Debug:", {
    user: user?.email,
    userId: user?.id,
    requiredRole,
    label,
  });
  const [hasPermission, setHasPermission] = React.useState(false);

  React.useEffect(() => {
    const checkPermissions = async () => {
      if (!user) return;
      try {
        const hasAccess = await checkAdminPermission(requiredRole);
        setHasPermission(hasAccess);
      } catch (error) {
        setHasPermission(false);
      }
    };

    checkPermissions();
  }, [user, requiredRole]);

  if (!hasPermission) {
    return null;
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/20 text-blue-400 border-r-2 border-blue-500"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-auto">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
};

export default AdminNavLink;
