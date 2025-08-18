import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./lib/auth";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { AuthCallback } from "./components/auth/AuthCallback";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { DashboardOverview } from "./components/dashboard/DashboardOverview";
import { CreditHistoryPage } from "./components/dashboard/CreditHistoryPage";
import { CVAnalysisPage } from "./components/dashboard/CVAnalysisPage";
import { BulkCVAnalysisPage } from "./components/dashboard/BulkCVAnalysisPage";
import { TalentSearchPage } from "./components/dashboard/TalentSearchPage";
import { TalentSearchHistoryPage } from "./components/dashboard/TalentSearchHistoryPage";
import { CVAnalysisHistoryPage } from "./components/dashboard/CVAnalysisHistoryPage";
import { InterviewPage } from "./components/dashboard/InterviewPage";
import { PricingPage } from "./components/pricing/PricingPage";
import AdminRoutes from "./router/AdminRoutes";
import { AboutPage } from "./components/pages/AboutPage";
import { ContactPage } from "./components/pages/ContactPage";
import { PrivacyPage } from "./components/pages/PrivacyPage";
import { TermsPage } from "./components/pages/TermsPage";
import { FeaturesPage } from "./components/pages/FeaturesPage";
import { Loader2 } from "lucide-react";
import { useTranslation, LanguageManager } from "./lib/i18n";
import { CreditManagement } from "./pages/admin/CreditManagement";
import DashboardRoutes from "./router/DashboardRoutes";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Layout for public pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

// Language wrapper component
function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const { isRTL } = useTranslation();

  useEffect(() => {
    // Initialize language manager
    const manager = LanguageManager.getInstance();
    document.documentElement.dir = manager.isRTL() ? "rtl" : "ltr";
    document.documentElement.lang = manager.getLanguage();
  }, []);

  return (
    <div className="App" dir={isRTL() ? "rtl" : "ltr"}>
      {children}
    </div>
  );
}

function App() {
  console.log("App component rendered");

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <LanguageWrapper>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <HomePage />
                  </PublicLayout>
                }
              />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />

              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="talent-search" element={<TalentSearchPage />} />
                <Route
                  path="talent-search-history"
                  element={<TalentSearchHistoryPage />}
                />
                <Route path="cv-analysis" element={<CVAnalysisPage />} />
                <Route
                  path="bulk-cv-analysis"
                  element={<BulkCVAnalysisPage />}
                />
                <Route
                  path="cv-analysis-history"
                  element={<CVAnalysisHistoryPage />}
                />
                <Route path="interview" element={<InterviewPage />} />
                <Route path="credit-history" element={<CreditHistoryPage />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminRoutes />
                  </ProtectedRoute>
                }
              />

              {/* Static Pages */}
              <Route
                path="/pricing"
                element={
                  <PublicLayout>
                    <PricingPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/features"
                element={
                  <PublicLayout>
                    <FeaturesPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <AboutPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/contact"
                element={
                  <PublicLayout>
                    <ContactPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/privacy"
                element={
                  <PublicLayout>
                    <PrivacyPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/terms"
                element={
                  <PublicLayout>
                    <TermsPage />
                  </PublicLayout>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Toast Notifications */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1e293b",
                  color: "#f1f5f9",
                  border: "1px solid #0891b2",
                  borderRadius: "12px",
                },
              }}
            />
          </LanguageWrapper>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
