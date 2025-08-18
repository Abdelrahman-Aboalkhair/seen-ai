import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import toast from "react-hot-toast";

interface GeneratedRequirements {
  jobTitle: string;
  requirements: string;
  skills: string[];
  certificates: string[];
  salaryRange: string;
  educationLevel: string;
  experience: string;
}

interface JobRequirementsGeneratorProps {
  onRequirementsGenerated: (requirements: GeneratedRequirements) => void;
}

export function JobRequirementsGenerator({
  onRequirementsGenerated,
}: JobRequirementsGeneratorProps) {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance, deductCredits } = useCreditBalance();

  const [jobInfo, setJobInfo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedRequirements, setGeneratedRequirements] = useState<GeneratedRequirements | null>(null);
  const [showResults, setShowResults] = useState(false);

  const CREDITS_COST = 10;

  const handleGenerateRequirements = async () => {
    if (!user) {
      toast.error(t("error.unauthorized"));
      return;
    }

    if (balance < CREDITS_COST) {
      toast.error(t("credit.insufficient"));
      return;
    }

    if (!jobInfo.trim()) {
      toast.error("يرجى إدخال معلومات الوظيفة");
      return;
    }

    setGenerating(true);

    try {
      // Call the Edge Function for job requirements generation
      const { data, error } = await supabase.functions.invoke("job-requirements-generator", {
        body: {
          jobInfo: jobInfo.trim(),
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error.message || "حدث خطأ أثناء توليد المتطلبات");
      }

      if (!data || !data.data) {
        throw new Error("لم يتم توليد المتطلبات بنجاح");
      }

      const requirements = data.data;
      setGeneratedRequirements(requirements);
      setShowResults(true);
      
      // Call the callback to pass requirements to parent
      onRequirementsGenerated(requirements);
      
      toast.success("تم توليد متطلبات الوظيفة بنجاح!");
    } catch (error: any) {
      console.error("Job requirements generation error:", error);
      toast.error(error.message || t("error.generic"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ إلى الحافظة");
  };

  const handleUseRequirements = () => {
    if (generatedRequirements) {
      onRequirementsGenerated(generatedRequirements);
      setShowResults(false);
    }
  };

  const handleReset = () => {
    setJobInfo("");
    setGeneratedRequirements(null);
    setShowResults(false);
  };

  if (showResults && generatedRequirements) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            متطلبات الوظيفة المولدة
          </h2>
          <p className="text-gray-400">
            تم توليد المتطلبات بنجاح لـ: {generatedRequirements.jobTitle}
          </p>
        </div>

        {/* Generated Requirements */}
        <div className="space-y-6">
          {/* Job Requirements */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">متطلبات الوظيفة</h3>
              <button
                onClick={() => handleCopyToClipboard(generatedRequirements.requirements)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {generatedRequirements.requirements}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">المهارات المطلوبة</h3>
            <div className="flex flex-wrap gap-2">
              {generatedRequirements.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm border border-cyan-500/30"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">الشهادات المطلوبة</h3>
            <div className="flex flex-wrap gap-2">
              {generatedRequirements.certificates.map((cert, index) => (
                <span
                  key={index}
                  className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-medium text-gray-400 mb-1">نطاق الراتب</h4>
              <p className="text-white font-semibold">{generatedRequirements.salaryRange}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-medium text-gray-400 mb-1">المستوى التعليمي</h4>
              <p className="text-white font-semibold">{generatedRequirements.educationLevel}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-medium text-gray-400 mb-1">الخبرة المطلوبة</h4>
              <p className="text-white font-semibold">{generatedRequirements.experience}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleUseRequirements}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>استخدام المتطلبات</span>
          </button>
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>توليد جديد</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          مولد متطلبات الوظيفة بالذكاء الاصطناعي
        </h2>
        <p className="text-gray-400">
          أدخل عنوان الوظيفة والمعلومات الأساسية لتوليد متطلبات الوظيفة المهنية والمهارات والشهادات ونطاق الراتب والمستوى التعليمي
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            عنوان الوظيفة والمعلومات الأساسية
          </label>
          <textarea
            value={jobInfo}
            onChange={(e) => setJobInfo(e.target.value)}
            placeholder="أدخل عنوان الوظيفة والمعلومات الأساسية عن المنصب..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
            disabled={generating}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateRequirements}
          disabled={generating || !jobInfo.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>جاري التوليد...</span>
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              <span>توليد المتطلبات ({CREDITS_COST} كريديت)</span>
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-300 text-sm">
              هذه الميزة تكلف {CREDITS_COST} كريديت لتوليد متطلبات الوظيفة المهنية
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
