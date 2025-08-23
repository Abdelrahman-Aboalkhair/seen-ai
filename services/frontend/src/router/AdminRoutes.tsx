import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import AdminDashboard from "../components/admin/AdminDashboard";
import UsersManagement from "../components/admin/UsersManagement";
import PaymentsManagement from "../pages/admin/PaymentsManagement";
import SupportCenter from "../pages/admin/SupportCenter";
import SystemSettings from "../pages/admin/SystemSettings";
import ApiManagement from "../pages/admin/ApiManagement";
import Analytics from "../pages/admin/Analytics";
import { CreditManagement } from "../pages/admin/CreditManagement";
import { TalentSearchPage } from "../features/talent-search";

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedAdminRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="payments" element={<PaymentsManagement />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="api" element={<ApiManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="talent-search" element={<TalentSearchPage />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="credit-management" element={<CreditManagement />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
