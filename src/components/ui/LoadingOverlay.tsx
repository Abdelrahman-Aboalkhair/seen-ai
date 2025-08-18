import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain, Search, FileText } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface LoadingOverlayProps {
  isVisible: boolean;
  type: "talent-search" | "cv-analysis";
}

export function LoadingOverlay({ isVisible, type }: LoadingOverlayProps) {
  const { t, isRTL } = useTranslation();
  const [currentMessage, setCurrentMessage] = useState(0);

  const talentSearchMessages = [
    "جاري تهيئة البحث...",
    "معالجة الذكاء الاصطناعي...",
    "البحث في قاعدة البيانات...",
    "ترتيب النتائج...",
    "إنهاء البحث...",
  ];

  const cvAnalysisMessages = [
    "جاري تهيئة التحليل...",
    "معالجة الملف...",
    "تحليل الذكاء الاصطناعي...",
    "تقييم المطابقة...",
    "إنهاء التحليل...",
  ];

  const messages =
    type === "talent-search" ? talentSearchMessages : cvAnalysisMessages;
  const Icon = type === "talent-search" ? Search : FileText;

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {type === "talent-search"
                ? "البحث عن الكفاءات"
                : "تحليل السيرة الذاتية"}
            </h2>
            <p className="text-gray-400">
              {type === "talent-search"
                ? "جاري البحث عن المرشحين المناسبين..."
                : "جاري تحليل السيرة الذاتية..."}
            </p>
          </div>

          {/* Loading Message */}
          <div className="text-center">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-center justify-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5 text-cyan-400" />
                </motion.div>
                <span className="text-white font-medium text-lg">
                  {messages[currentMessage]}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Subtle Animation */}
          <div className="mt-6 text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block"
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full mx-1"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full mx-1"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full mx-1"></div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
