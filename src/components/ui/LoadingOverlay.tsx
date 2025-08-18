import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Users,
  Brain,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  type: "talent-search" | "cv-analysis";
  onComplete?: () => void;
}

export function LoadingOverlay({
  isVisible,
  type,
  onComplete,
}: LoadingOverlayProps) {
  const { t, isRTL } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const talentSearchSteps: LoadingStep[] = [
    {
      id: "init",
      title: isRTL() ? "جاري تهيئة البحث" : "Initializing Search",
      description: isRTL()
        ? "إعداد معايير البحث وتحليل المتطلبات"
        : "Setting up search criteria and analyzing requirements",
      icon: Target,
      duration: 2000,
    },
    {
      id: "ai-processing",
      title: isRTL() ? "معالجة الذكاء الاصطناعي" : "AI Processing",
      description: isRTL()
        ? "تحليل المتطلبات ومطابقة المرشحين"
        : "Analyzing requirements and matching candidates",
      icon: Brain,
      duration: 4000,
    },
    {
      id: "searching",
      title: isRTL() ? "البحث في قاعدة البيانات" : "Searching Database",
      description: isRTL()
        ? "البحث عن المرشحين المطابقين"
        : "Finding matching candidates",
      icon: Search,
      duration: 3000,
    },
    {
      id: "ranking",
      title: isRTL() ? "ترتيب النتائج" : "Ranking Results",
      description: isRTL()
        ? "ترتيب المرشحين حسب درجة المطابقة"
        : "Ranking candidates by match score",
      icon: Users,
      duration: 2000,
    },
    {
      id: "finalizing",
      title: isRTL() ? "إنهاء البحث" : "Finalizing Search",
      description: isRTL()
        ? "إعداد النتائج النهائية"
        : "Preparing final results",
      icon: CheckCircle2,
      duration: 1000,
    },
  ];

  const cvAnalysisSteps: LoadingStep[] = [
    {
      id: "init",
      title: isRTL() ? "جاري تهيئة التحليل" : "Initializing Analysis",
      description: isRTL()
        ? "إعداد معايير التحليل"
        : "Setting up analysis criteria",
      icon: Target,
      duration: 1500,
    },
    {
      id: "processing",
      title: isRTL() ? "معالجة الملف" : "Processing File",
      description: isRTL()
        ? "قراءة وتحليل السيرة الذاتية"
        : "Reading and analyzing CV",
      icon: FileText,
      duration: 3000,
    },
    {
      id: "ai-analysis",
      title: isRTL() ? "تحليل الذكاء الاصطناعي" : "AI Analysis",
      description: isRTL()
        ? "تحليل المهارات والخبرات"
        : "Analyzing skills and experience",
      icon: Brain,
      duration: 4000,
    },
    {
      id: "scoring",
      title: isRTL() ? "تقييم المطابقة" : "Scoring Match",
      description: isRTL()
        ? "حساب درجة المطابقة مع الوظيفة"
        : "Calculating job match score",
      icon: Zap,
      duration: 2500,
    },
    {
      id: "finalizing",
      title: isRTL() ? "إنهاء التحليل" : "Finalizing Analysis",
      description: isRTL() ? "إعداد التقرير النهائي" : "Preparing final report",
      icon: CheckCircle2,
      duration: 1000,
    },
  ];

  const steps = type === "talent-search" ? talentSearchSteps : cvAnalysisSteps;

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Simplified progress calculation - just increment smoothly
    const totalSteps = steps.length;
    const stepDuration = 2000; // 2 seconds per step
    const totalDuration = totalSteps * stepDuration;

    let currentTime = 0;
    let stepIndex = 0;

    const interval = setInterval(() => {
      currentTime += 100;
      const newProgress = Math.min((currentTime / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update current step every 2 seconds
      const newStepIndex = Math.floor(currentTime / stepDuration);
      if (newStepIndex !== stepIndex && newStepIndex < totalSteps) {
        setCurrentStep(newStepIndex);
        stepIndex = newStepIndex;
      }

      if (currentTime >= totalDuration) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, steps, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            {type === "talent-search" ? (
              <Search className="h-8 w-8 text-white" />
            ) : (
              <FileText className="h-8 w-8 text-white" />
            )}
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {type === "talent-search"
              ? isRTL()
                ? "البحث عن المواهب"
                : "Talent Search"
              : isRTL()
              ? "تحليل السيرة الذاتية"
              : "CV Analysis"}
          </h2>
          <p className="text-gray-400">
            {type === "talent-search"
              ? isRTL()
                ? "جاري البحث عن أفضل المرشحين..."
                : "Searching for the best candidates..."
              : isRTL()
              ? "جاري تحليل السيرة الذاتية..."
              : "Analyzing the CV..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{isRTL() ? "التقدم" : "Progress"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: index === currentStep ? 1 : 0.5,
                x: index === currentStep ? 0 : 20,
                scale: index === currentStep ? 1 : 0.95,
              }}
              transition={{ duration: 0.3 }}
              className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${
                index === currentStep
                  ? "bg-slate-800/50 border border-cyan-500/30"
                  : "bg-slate-800/20"
              } ${isRTL() ? "space-x-reverse" : ""}`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? "bg-green-500/20 text-green-400"
                    : index === currentStep
                    ? "bg-cyan-500/20 text-cyan-400 animate-pulse"
                    : "bg-slate-700/50 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className={`flex-1 ${isRTL() ? "text-right" : ""}`}>
                <h3
                  className={`font-medium ${
                    index === currentStep ? "text-white" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sparkles Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * 400,
                y: Math.random() * 300,
                opacity: 0,
              }}
              animate={{
                x: Math.random() * 400,
                y: Math.random() * 300,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Sparkles className="h-4 w-4 text-cyan-400/60" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
