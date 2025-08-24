import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { TalentSearchPage } from "../features/talent-search/components/TalentSearchPage";
import { CVAnalysisPage } from "../components/dashboard/CVAnalysisPage";
import { CVAnalysisPageNew } from "../components/dashboard/CVAnalysisPageNew";
import { CVAnalysisHistoryPage } from "../components/dashboard/CVAnalysisHistoryPage";
import { TalentSearchHistoryPage } from "../components/dashboard/TalentSearchHistoryPage";
import { CreditHistoryPage } from "../components/dashboard/CreditHistoryPage";
import { PricingPage } from "../components/pricing/PricingPage";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import { CreditManagement } from "../pages/admin/CreditManagement";
import UserSettingsPage from "../components/dashboard/UserSettingsPage";

const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedAdminRoute>
            <DashboardLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DashboardOverview />} />
        <Route path="talent-search" element={<TalentSearchPage />} />
        <Route
          path="talent-search-history"
          element={<TalentSearchHistoryPage />}
        />
        <Route path="cv-analysis" element={<CVAnalysisPage />} />
        <Route path="cv-analysis-new" element={<CVAnalysisPageNew />} />
        <Route path="cv-analysis-history" element={<CVAnalysisHistoryPage />} />
        <Route path="credit-history" element={<CreditHistoryPage />} />
        <Route path="credit-management" element={<CreditManagement />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;
