import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "../../../lib/adminApi";
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  role_display_name?: string;
  is_suspended: boolean;
  created_at: string;
  last_login?: string;
  login_count: number;
  credits?: number;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  level: number;
  user_count: number;
  is_active: boolean;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState("");
  const [newRole, setNewRole] = useState("");
  const [roleChangeReason, setRoleChangeReason] = useState("");

  // Add admin modal state
  const [newUserData, setNewUserData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "admin",
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        search: searchTerm,
        role: selectedRole,
      });

      console.log("API Response:", response); // للتشخيص

      // التأكد من وجود المفتاح الصحيح
      if (response && response.data && response.data.users) {
        setUsers(response.data.users);
      } else if (response && response.users) {
        setUsers(response.users);
      } else {
        console.warn("استجابة غير متوقعة:", response);
        setUsers([]);
      }
    } catch (error) {
      console.error("خطأ في جلب المستخدمين:", error);
      toast.error("فشل في جلب قائمة المستخدمين");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      await adminApi.suspendUser(
        userId,
        suspend,
        suspend ? "إيقاف من قبل المشرف" : undefined
      );
      toast.success(
        suspend ? "تم إيقاف المستخدم بنجاح" : "تم تفعيل المستخدم بنجاح"
      );
      loadUsers();
    } catch (error) {
      console.error("خطأ في تعديل حالة المستخدم:", error);
      toast.error("فشل في تعديل حالة المستخدم");
    }
  };

  const loadRoles = async () => {
    try {
      const response = await adminApi.getRoles();
      console.log("Roles Response:", response); // للتشخيص

      if (response && response.data && response.data.roles) {
        setRoles(response.data.roles);
      } else if (response && response.roles) {
        setRoles(response.roles);
      } else {
        console.warn("استجابة غير متوقعة:", response);
        setRoles([]);
      }
    } catch (error) {
      console.error("خطأ في جلب الأدوار:", error);
      setRoles([]);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) {
      toast.error("يرجى اختيار دور صحيح");
      return;
    }

    if (selectedUser.role === newRole) {
      toast.error("المستخدم لديه هذا الدور بالفعل");
      return;
    }

    try {
      await adminApi.assignRole(
        selectedUser.id,
        newRole,
        roleChangeReason || undefined
      );
      toast.success(
        `تم تحديث الدور إلى ${
          roles.find((r) => r.name === newRole)?.display_name || newRole
        } بنجاح`
      );
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole("");
      setRoleChangeReason("");
      loadUsers(); // إعادة تحميل المستخدمين
    } catch (error) {
      console.error("خطأ في تحديث الدور:", error);
      toast.error("فشل في تحديث الدور");
    }
  };

  const handleGrantCredits = async () => {
    if (!selectedUser || creditAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    try {
      await adminApi.grantCredits(
        selectedUser.id,
        creditAmount,
        creditReason || "منحة من المشرف"
      );
      toast.success(`تم منح ${creditAmount} نقطة بنجاح`);
      setShowCreditModal(false);
      setCreditAmount(0);
      setCreditReason("");
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("خطأ في منح النقاط:", error);
      toast.error("فشل في منح النقاط");
    }
  };

  const handleCreateAdmin = async () => {
    if (!newUserData.email || !newUserData.full_name || !newUserData.password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (newUserData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      // Create admin user using the Edge Function
      const result = await adminApi.createAdminUser(
        newUserData.email,
        newUserData.password,
        newUserData.full_name,
        newUserData.role
      );

      if (result.success) {
        toast.success("تم إنشاء المشرف بنجاح");
        setShowAddModal(false);
        setNewUserData({
          email: "",
          full_name: "",
          password: "",
          role: "admin",
        });
        loadUsers();
      } else {
        throw new Error(result.error?.message || "فشل في إنشاء المشرف");
      }
    } catch (error) {
      console.error("خطأ في إنشاء المشرف:", error);
      toast.error("فشل في إنشاء المشرف");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-400">جاري تحميل المستخدمين...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المستخدمين</h1>
          <p className="text-gray-400 mt-1">إدارة وتتبع جميع مستخدمي النظام</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <UserPlusIcon className="h-5 w-5" />
          إنشاء مشرف جديد
        </button>
      </div>

      {/* إحصائيات الأدوار */}
      {roles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    {role.display_name}
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {role.user_count}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    role.name === "super_admin"
                      ? "bg-red-500/20 text-red-400"
                      : role.name === "admin"
                      ? "bg-purple-500/20 text-purple-400"
                      : role.name === "manager"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* شريط البحث والفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="البحث بالاسم أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الأدوار</option>
            {roles.map((role) => (
              <option key={role.name} value={role.name}>
                {role.display_name} ({role.user_count})
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={loadUsers}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            تحديث القائمة
          </button>
        </div>
      </div>

      {/* جدول المستخدمين */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    لا توجد مستخدمين
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.full_name?.charAt(0) ||
                                user.email?.charAt(0) ||
                                "U"}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-white">
                            {user.full_name || "غير محدد"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "super_admin"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : user.role === "manager"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {user.role_display_name || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_suspended
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.is_suspended ? "معلق" : "نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="تعديل الدور"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowCreditModal(true);
                          }}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors"
                          title="منح نقاط"
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleSuspendUser(user.id, !user.is_suspended)
                          }
                          className={`p-2 rounded transition-colors ${
                            user.is_suspended
                              ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          }`}
                          title={
                            user.is_suspended
                              ? "تفعيل المستخدم"
                              : "إيقاف المستخدم"
                          }
                        >
                          {user.is_suspended ? (
                            <UserIcon className="h-4 w-4" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة منح النقاط */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              منح نقاط لـ {selectedUser.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عدد النقاط
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل عدد النقاط"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  السبب (اختياري)
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سبب منح النقاط"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setSelectedUser(null);
                  setCreditAmount(0);
                  setCreditReason("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleGrantCredits}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                منح النقاط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الدور */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              تعديل دور {selectedUser.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الدور الحالي:{" "}
                  <span className="text-blue-400">
                    {selectedUser.role_display_name || selectedUser.role}
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الدور الجديد
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  سبب التغيير (اختياري)
                </label>
                <input
                  type="text"
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سبب تغيير الدور"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setNewRole("");
                  setRoleChangeReason("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!newRole || newRole === selectedUser.role}
              >
                حفظ التغيير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إنشاء مشرف جديد */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              إنشاء مشرف جديد
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={newUserData.full_name}
                  onChange={(e) =>
                    setNewUserData({
                      ...newUserData,
                      full_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="كلمة المرور للمشرف (6 أحرف على الأقل)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  دور المشرف
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles
                    .filter((role) => role.name !== "user")
                    .map((role) => (
                      <option key={role.name} value={role.name}>
                        {role.display_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUserData({
                    email: "",
                    full_name: "",
                    password: "",
                    role: "admin",
                  });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                إنشاء المشرف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
