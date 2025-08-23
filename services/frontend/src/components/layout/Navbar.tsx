import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Button } from "../ui/Button";
import { BrainCircuit, Menu, X } from "lucide-react";
import { useState } from "react";
import { CreditBalance } from "../credit/CreditBalance";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useTranslation } from "../../lib/i18n";

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { t, isRTL } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.features"), href: "/features" },
    { name: t("nav.pricing"), href: "/pricing" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-cyan-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className={`flex items-center ${
              isRTL() ? "space-x-reverse space-x-3" : "space-x-3"
            }`}
          >
            <img src="/seen-ai-logo.jpg" alt="SEEN AI" className="h-8 w-auto" />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                SEEN AI
              </span>
              <span className="text-xs text-gray-400 -mt-1">HR Solutions</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div
            className={`hidden md:flex items-center ${
              isRTL() ? "space-x-reverse space-x-8" : "space-x-8"
            }`}
          >
            {!user && (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}

            <div
              className={`flex items-center ${
                isRTL() ? "space-x-reverse space-x-4" : "space-x-4"
              }`}
            >
              <LanguageSwitcher />
              {user && <CreditBalance />}
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="secondary" size="sm">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                  <Button variant="text" size="sm" onClick={signOut}>
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="text" size="sm">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary" size="sm">
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="text"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800 border-t border-cyan-500/20">
            {!user && (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block px-3 py-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}

            <div className="px-3 py-2 space-y-2">
              <div className="mb-3">
                <LanguageSwitcher />
              </div>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                  <Button
                    variant="text"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="text" size="sm" className="w-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
