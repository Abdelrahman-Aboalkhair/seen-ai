import React from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, Mail, Phone, MapPin } from 'lucide-react'
import { useTranslation } from '../../lib/i18n'

export function Footer() {
  const { t, isRTL } = useTranslation()
  
  return (
    <footer className="bg-slate-900 border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className={`flex items-center mb-4 ${isRTL() ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <img src="/logo-new.png" alt="SEEN AI" className="h-8 w-auto" />
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  SEEN AI
                </span>
                <span className="text-xs text-gray-400">
                  HR Solutions
                </span>
              </div>
            </div>
            <p className="text-gray-400 max-w-md mb-6">
              {t('company.description')}
            </p>
            <div className={`flex gap-4 ${isRTL() ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center text-gray-400 ${isRTL() ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@seenai.com</span>
              </div>
              <div className={`flex items-center text-gray-400 ${isRTL() ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Phone className="h-4 w-4" />
                <span className="text-sm">+966 50 123 4567</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('nav.home')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.features')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('nav.about')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.privacy' as any)}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.terms' as any)}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 SEEN AI HR Solutions. {t('message.copyright' as any)}
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              {t('company.tagline')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}