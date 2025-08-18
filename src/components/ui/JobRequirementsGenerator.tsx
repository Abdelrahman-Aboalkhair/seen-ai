import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  RefreshCw,
  X,
  Edit3,
  Save,
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
  const [generatedRequirements, setGeneratedRequirements] =
    useState<GeneratedRequirements | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRequirements, setEditedRequirements] =
    useState<GeneratedRequirements | null>(null);

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
      const { data, error } = await supabase.functions.invoke(
        "job-requirements-generator",
        {
          body: {
            jobInfo: jobInfo.trim(),
            userId: user.id,
          },
        }
      );

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

  const handleAcceptRequirements = () => {
    if (generatedRequirements) {
      onRequirementsGenerated(generatedRequirements);
      setShowResults(false);
      setIsEditing(false);
      setEditedRequirements(null);
      toast.success("تم تطبيق المتطلبات على النموذج");
    }
  };

  const handleRejectRequirements = () => {
    setGeneratedRequirements(null);
    setShowResults(false);
    setIsEditing(false);
    setEditedRequirements(null);
    toast.success("تم رفض المتطلبات المولدة");
  };

  const handleEditRequirements = () => {
    if (generatedRequirements) {
      setEditedRequirements({ ...generatedRequirements });
      setIsEditing(true);
    }
  };

  const handleSaveEdits = () => {
    if (editedRequirements) {
      setGeneratedRequirements(editedRequirements);
      setIsEditing(false);
      toast.success("تم حفظ التعديلات");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRequirements(null);
  };

  const handleReset = () => {
    setJobInfo("");
    setGeneratedRequirements(null);
    setShowResults(false);
    setIsEditing(false);
    setEditedRequirements(null);
  };

  // Function to render editable field
  const renderEditableField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    multiline: boolean = false
  ) => (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-3">{label}</h3>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
      )}
    </div>
  );

  // Function to render editable array field
  const renderEditableArrayField = (
    label: string,
    values: string[],
    onChange: (values: string[]) => void
  ) => (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-3">{label}</h3>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newValues = [...values];
                newValues[index] = e.target.value;
                onChange(newValues);
              }}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <button
              onClick={() => {
                const newValues = values.filter((_, i) => i !== index);
                onChange(newValues);
              }}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...values, ""])}
          className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
        >
          إضافة عنصر جديد
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {/* Input Form - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
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
            أدخل عنوان الوظيفة والمعلومات الأساسية لتوليد متطلبات الوظيفة
            المهنية والمهارات والشهادات ونطاق الراتب والمستوى التعليمي
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
                هذه الميزة تكلف {CREDITS_COST} كريديت لتوليد متطلبات الوظيفة
                المهنية
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Generated Requirements Display - Right Side */}
      {showResults && generatedRequirements ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isEditing ? "تعديل متطلبات الوظيفة" : "متطلبات الوظيفة المولدة"}
            </h2>
            <p className="text-gray-400">
              {isEditing
                ? "يمكنك تعديل المتطلبات قبل تطبيقها على النموذج"
                : `تم توليد المتطلبات بنجاح لـ: ${generatedRequirements.jobTitle}`}
            </p>
          </div>

          {/* Generated Requirements */}
          <div className="space-y-6">
            {isEditing && editedRequirements ? (
              // Edit Mode
              <>
                {renderEditableField(
                  "عنوان الوظيفة",
                  editedRequirements.jobTitle,
                  (value) =>
                    setEditedRequirements({
                      ...editedRequirements,
                      jobTitle: value,
                    })
                )}

                {renderEditableField(
                  "متطلبات الوظيفة",
                  editedRequirements.requirements,
                  (value) =>
                    setEditedRequirements({
                      ...editedRequirements,
                      requirements: value,
                    }),
                  true
                )}

                {renderEditableArrayField(
                  "المهارات المطلوبة",
                  editedRequirements.skills,
                  (values) =>
                    setEditedRequirements({
                      ...editedRequirements,
                      skills: values.filter((v) => v.trim()),
                    })
                )}

                {renderEditableArrayField(
                  "الشهادات المطلوبة",
                  editedRequirements.certificates,
                  (values) =>
                    setEditedRequirements({
                      ...editedRequirements,
                      certificates: values.filter((v) => v.trim()),
                    })
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderEditableField(
                    "نطاق الراتب",
                    editedRequirements.salaryRange,
                    (value) =>
                      setEditedRequirements({
                        ...editedRequirements,
                        salaryRange: value,
                      })
                  )}
                  {renderEditableField(
                    "المستوى التعليمي",
                    editedRequirements.educationLevel,
                    (value) =>
                      setEditedRequirements({
                        ...editedRequirements,
                        educationLevel: value,
                      })
                  )}
                  {renderEditableField(
                    "الخبرة المطلوبة",
                    editedRequirements.experience,
                    (value) =>
                      setEditedRequirements({
                        ...editedRequirements,
                        experience: value,
                      })
                  )}
                </div>
              </>
            ) : (
              // View Mode
              <>
                {/* Job Requirements */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      متطلبات الوظيفة
                    </h3>
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          generatedRequirements.requirements
                        )
                      }
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
                  <h3 className="text-lg font-semibold text-white mb-3">
                    المهارات المطلوبة
                  </h3>
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
                  <h3 className="text-lg font-semibold text-white mb-3">
                    الشهادات المطلوبة
                  </h3>
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
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      نطاق الراتب
                    </h4>
                    <p className="text-white font-semibold">
                      {generatedRequirements.salaryRange}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      المستوى التعليمي
                    </h4>
                    <p className="text-white font-semibold">
                      {generatedRequirements.educationLevel}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      الخبرة المطلوبة
                    </h4>
                    <p className="text-white font-semibold">
                      {generatedRequirements.experience}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {isEditing ? (
              // Edit Mode Actions
              <>
                <button
                  onClick={handleSaveEdits}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>حفظ التعديلات</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>إلغاء التعديل</span>
                </button>
              </>
            ) : (
              // View Mode Actions
              <>
                <button
                  onClick={handleEditRequirements}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Edit3 className="h-5 w-5" />
                  <span>تعديل المتطلبات</span>
                </button>
                <button
                  onClick={handleAcceptRequirements}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>قبول واستخدام المتطلبات</span>
                </button>
                <button
                  onClick={handleRejectRequirements}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>رفض المتطلبات</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        // Placeholder when no results
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-400 mb-2">
              متطلبات الوظيفة المولدة
            </h2>
            <p className="text-slate-500">
              ستظهر المتطلبات المولدة هنا بعد إدخال معلومات الوظيفة
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
