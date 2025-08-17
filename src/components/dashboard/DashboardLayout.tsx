import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useTranslation } from "../../lib/i18n";
import { Button } from "../ui/Button";
import {
  LayoutDashboard,
  Search,
  FileSearch,
  FileText,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
  UserPlus,
  Shield,
  History,
} from "lucide-react";
import toast from "react-hot-toast";

export function DashboardLayout() {
  const { user, profile, signOut } = useAuth();
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    {
      name: t("dashboard.overview"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("dashboard.talent_search"),
      href: "/dashboard/talent-search",
      icon: Search,
    },
    {
      name: t("dashboard.talent_search_history"),
      href: "/dashboard/talent-search-history",
      icon: Users,
    },
    {
      name: t("dashboard.cv_analysis"),
      href: "/dashboard/cv-analysis",
      icon: FileSearch,
    },
    {
      name: t("dashboard.cv_analysis_history"),
      href: "/dashboard/cv-analysis-history",
      icon: FileText,
    },
    {
      name: t("dashboard.credit_history"),
      href: "/dashboard/credit-history",
      icon: History,
    },
    { name: t("nav.pricing"), href: "/pricing", icon: CreditCard },
    {
      name: t("dashboard.settings"),
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Add admin panel link if user is admin
  if (profile?.is_admin) {
    navigation.splice(-1, 0, {
      name: "Admin Panel",
      href: "/dashboard/admin",
      icon: Shield,
    });
  }

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error(t("error.generic"));
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const SidebarContent = ({ isCollapsed = false }) => (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center">
        <Link
          to="/"
          className={`flex items-center transition-all duration-300 ${
            isRTL() ? "space-x-reverse space-x-3" : "space-x-3"
          }`}
        >
          <img
            src="/seen-ai-logo.jpg"
            alt="SEEN AI Logo"
            className="h-8 w-8 object-contain"
          />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 1, width: "auto" }}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
            >
              SEEN AI
            </motion.span>
          )}
        </Link>
      </div>

      {/* Credits Display */}
      {!isCollapsed ? (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex items-center ${
                isRTL() ? "space-x-reverse space-x-2" : "space-x-2"
              }`}
            >
              <Coins className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">
                {t("credit.balance")}
              </span>
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {(profile?.credits || 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    ((profile?.credits || 0) / 1000) * 100
                  )}%`,
                }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {profile?.credits && profile.credits < 50
                ? isRTL()
                  ? "رصيد منخفض - تحتاج لشراء حزمة"
                  : "Low balance - Need to purchase package"
                : isRTL()
                ? "رصيد جيد"
                : "Good balance"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-2 flex items-center justify-center">
          <div className="text-center">
            <Coins className="h-6 w-6 text-cyan-400 mx-auto" />
            <div className="text-xs font-bold text-cyan-400 mt-1">
              {(profile?.credits || 0) > 999
                ? `${Math.floor((profile?.credits || 0) / 1000)}k`
                : profile?.credits || 0}
            </div>
          </div>
        </div>
      )}

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
                        ${isCollapsed ? "justify-center" : ""}
                        ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
                            : "text-gray-300 hover:text-cyan-400 hover:bg-slate-700/50"
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 1, width: "auto" }}
                          animate={{
                            opacity: isCollapsed ? 0 : 1,
                            width: isCollapsed ? 0 : "auto",
                          }}
                          transition={{ duration: 0.3 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User Info & Sign Out */}
          <li className="mt-auto">
            {!isCollapsed ? (
              <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                <div
                  className={`flex items-center ${
                    isRTL() ? "space-x-reverse space-x-3" : "space-x-3"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.full_name?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.full_name || t("message.welcome")}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-2 mb-3 flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {profile?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="text"
              onClick={handleSignOut}
              className={`w-full text-gray-300 hover:text-red-400 transition-all duration-200 ${
                isCollapsed
                  ? "justify-center p-2"
                  : isRTL()
                  ? "justify-end"
                  : "justify-start"
              }`}
              title={isCollapsed ? t("nav.logout") : undefined}
            >
              <LogOut
                className={`h-5 w-5 ${
                  !isCollapsed && (isRTL() ? "ml-3" : "mr-3")
                }`}
              />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 1, width: "auto" }}
                  animate={{
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : "auto",
                  }}
                  transition={{ duration: 0.3 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {t("nav.logout")}
                </motion.span>
              )}
            </Button>
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar for desktop */}
      <div
        className={`hidden lg:flex ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300 ${
          isRTL() ? "lg:right-0" : "lg:left-0"
        }`}
      >
        <div
          className={`flex grow flex-col gap-y-5 overflow-y-auto bg-slate-800/50 backdrop-blur-xl border-cyan-500/20 px-4 pb-4 ${
            isRTL() ? "border-l" : "border-r"
          }`}
        >
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`absolute ${
            isRTL() ? "-left-3" : "-right-3"
          } top-6 w-6 h-6 bg-slate-800 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-all duration-200 z-10`}
        >
          <Menu
            className={`h-3 w-3 transition-transform duration-300 ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="relative z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-slate-900/80"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-0 flex">
              <motion.div
                initial={{ x: isRTL() ? 320 : -320 }}
                animate={{ x: 0 }}
                exit={{ x: isRTL() ? 320 : -320 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`relative flex w-full max-w-xs flex-1 ${
                  isRTL() ? "ml-16" : "mr-16"
                }`}
              >
                <div
                  className={`absolute top-0 flex w-16 justify-center pt-5 ${
                    isRTL() ? "right-full" : "left-full"
                  }`}
                >
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-800/95 backdrop-blur-xl px-6 pb-4">
                  <SidebarContent isCollapsed={false} />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } ${
          isRTL()
            ? sidebarCollapsed
              ? "lg:mr-20 lg:ml-0"
              : "lg:mr-64 lg:ml-0"
            : ""
        }`}
      >
        {/* Mobile menu button */}
        <div
          className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8`}
        >
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-cyan-400 transition-colors lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 text-sm font-semibold leading-6 text-white">
            {t("nav.dashboard")}
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
}
