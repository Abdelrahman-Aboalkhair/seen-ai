import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useTranslation } from "../../lib/i18n";
import { Button } from "../../components/ui/Button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  HeadphonesIcon,
  Settings,
  BarChart3,
  Code,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users Management",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      name: "Payments",
      href: "/dashboard/admin/payments",
      icon: CreditCard,
    },
    {
      name: "Support Center",
      href: "/dashboard/admin/support",
      icon: HeadphonesIcon,
    },
    {
      name: "API Management",
      href: "/dashboard/admin/api",
      icon: Code,
    },
    {
      name: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "System Settings",
      href: "/dashboard/admin/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error(t("error.generic"));
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center">
        <Link
          to="/dashboard"
          className={`flex items-center transition-all duration-300 ${
            isRTL() ? "space-x-reverse space-x-3" : "space-x-3"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <motion.span
            initial={{ opacity: 1, width: "auto" }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.3 }}
            className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
          >
            Admin Panel
          </motion.span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-all duration-200 relative
                        ${isRTL() ? "flex-row-reverse" : ""}
                        ${
                          isActive
                            ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30"
                            : "text-gray-300 hover:text-red-400 hover:bg-slate-700/50"
                        }
                      `}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      <motion.span
                        initial={{ opacity: 1, width: "auto" }}
                        animate={{ opacity: 1, width: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User Info & Sign Out */}
          <li className="mt-auto">
            <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
              <div
                className={`flex items-center ${
                  isRTL() ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {profile?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "A"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="text"
              onClick={handleSignOut}
              className={`w-full text-gray-300 hover:text-red-400 transition-all duration-200 ${
                isRTL() ? "justify-end" : "justify-start"
              }`}
            >
              <LogOut
                className={`h-5 w-5 ${
                  isRTL() ? "ml-3" : "mr-3"
                }`}
              />
              <motion.span
                initial={{ opacity: 1, width: "auto" }}
                animate={{ opacity: 1, width: "auto" }}
                transition={{ duration: 0.3 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {t("nav.logout")}
              </motion.span>
            </Button>
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-800/50 backdrop-blur-xl border-red-500/20 border-r px-4 pb-4">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="relative z-50 lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/80" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="fixed inset-0 flex">
          <div
            className={`relative flex w-full max-w-xs flex-1 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out`}
          >
            <div className="absolute top-0 flex w-16 justify-center pt-5 left-full">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-800/95 backdrop-blur-xl px-6 pb-4">
              <SidebarContent />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile menu button */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-red-400 transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 text-sm font-semibold leading-6 text-white">
            Admin Panel
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
