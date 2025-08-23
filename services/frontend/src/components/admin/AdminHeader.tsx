import React, { useState } from "react";
import {
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

const AdminHeader: React.FC = () => {
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // سيتم إعادة توجيه المستخدم تلقائياً بعد تغيير حالة المصادقة
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  // بيانات وهمية للإشعارات
  const notifications = [
    {
      id: 1,
      title: "تذكرة دعم جديدة",
      message: "تم إنشاء تذكرة دعم جديدة من أحمد محمد",
      time: "منذ 5 دقائق",
      unread: true,
    },
    {
      id: 2,
      title: "عملية دفع جديدة",
      message: "تمت عملية دفع بقيمة $99.99",
      time: "منذ 15 دقيقة",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* عنواة الصفحة */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            لوحة التحكم الإدارية
          </h1>
          <p className="text-gray-400 text-sm">مرحباً بك في SEEN AI HR</p>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center gap-4">
          {/* زر الإشعارات */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* قائمة الإشعارات */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-white font-medium">الإشعارات</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer ${
                        notification.unread ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">
                            {notification.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-700">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    عرض جميع الإشعارات
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* قائمة المستخدم */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <UserCircleIcon className="h-8 w-8" />
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {user?.email || "مستخدم"}
                </p>
                <p className="text-gray-400 text-xs">مشرف</p>
              </div>
            </button>

            {/* قائمة الملف الشخصي */}
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button className="flex items-center gap-3 w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-right transition-colors">
                    <UserCircleIcon className="h-5 w-5" />
                    الملف الشخصي
                  </button>
                  <button className="flex items-center gap-3 w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-right transition-colors">
                    <Cog6ToothIcon className="h-5 w-5" />
                    الإعدادات
                  </button>
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={handleLogout}
                    data-testid="logout"
                    className="flex items-center gap-3 w-full p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-right transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
