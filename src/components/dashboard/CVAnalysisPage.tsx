import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Upload,
  Zap,
  AlertCircle,
  Users,
  Filter,
  SortDesc,
  Download,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { CVAnalysisCard } from "../ui/CVAnalysisCard";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { exportResults } from "../../utils/exportUtils";
import toast from "react-hot-toast";

export function CVAnalysisPage() {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance, deductCredits } = useCreditBalance();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [cvText, setCvText] = useState("");
  const [inputMethod, setInputMethod] = useState<"file" | "text">("file");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState("vote");
  const [filterByScore, setFilterByScore] = useState("all");
  const [exporting, setExporting] = useState(false);

  const CREDITS_COST = 5;

  const handleAnalyze = async () => {
    if (!user) {
      toast.error(t("error.unauthorized"));
      return;
    }

    if (balance < CREDITS_COST) {
      toast.error(t("credit.insufficient"));
      return;
    }

    if (
      !jobTitle.trim() ||
      !skillsRequired.trim() ||
      (inputMethod === "file" && (!files || files.length === 0)) ||
      (inputMethod === "text" && !cvText.trim())
    ) {
      toast.error(t("error.validation"));
      return;
    }

    setAnalyzing(true);

    try {
      const requestBody: any = {
        jobTitle,
        jobDescription,
        skillsRequired: skillsRequired, // Send as string, not array
        userId: user?.id, // Include user ID
      };

      if (inputMethod === "file" && files && files.length > 0) {
        // Convert file to base64
        const file = files[0];
        const base64File = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        requestBody.cvFile = base64File;
      } else if (inputMethod === "text") {
        requestBody.cvText = cvText;
      }

      // Add a minimum delay to show the loading animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

      // Call the Edge Function for CV analysis
      const analysisPromise = supabase.functions.invoke("cv-analysis", {
        body: requestBody,
      });

      // Wait for both the minimum delay and the actual API call
      const [data, error] = await Promise.all([analysisPromise, minDelay]).then(
        ([result]) => [result.data, result.error]
      );

      if (error) {
        throw error;
      }

      // Check for error in response body (since we now return 200 status for errors)
      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (!data || !data.data || !data.data.cvAnalysis) {
        throw new Error("لم يتم العثور على نتائج التحليل");
      }

      // Update local balance
      const newBalance = data.data.remainingCredits;
      // You might need to update your credit balance hook here

      setResults(data.data.cvAnalysis);
      setShowResults(true);
      toast.success(
        `تم تحليل السيرة الذاتية بنجاح: ${data.data.cvAnalysis.length} نتيجة!`
      );
    } catch (error: any) {
      console.error("CV Analysis error:", error);
      toast.error(error.message || t("error.generic"));
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter and sort results for CV analysis
  const getFilteredAndSortedResults = () => {
    let filteredResults = [...results];

    // Filter by vote (CV analysis uses vote instead of match_score)
    if (filterByScore === "high") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) >= 8);
    } else if (filterByScore === "medium") {
      filteredResults = filteredResults.filter(
        (c) => parseInt(c.vote) >= 6 && parseInt(c.vote) < 8
      );
    } else if (filterByScore === "low") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) < 6);
    }

    // Sort results
    if (sortBy === "vote") {
      filteredResults.sort((a, b) => parseInt(b.vote) - parseInt(a.vote));
    } else if (sortBy === "name") {
      filteredResults.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "ranking") {
      filteredResults.sort((a, b) => a.ranking - b.ranking);
    }

    return filteredResults;
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    if (results.length === 0) {
      toast.error("لا توجد نتائج للتصدير");
      return;
    }

    setExporting(true);
    try {
      const fileName = `cv-analysis-${new Date().toISOString().split("T")[0]}`;
      await exportResults(results, { format, fileName });
      toast.success(`تم تصدير النتائج بنجاح بصيغة ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل في تصدير النتائج");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div
          className={`flex items-center justify-between ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("services.cv_analysis.title")}
            </h1>
            <p className="text-gray-400">
              {t("services.cv_analysis.description")}
            </p>
          </div>
          <Link
            to="/dashboard/cv-analysis-history"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t("dashboard.cv_analysis_history")}
          </Link>
        </div>
      </div>

      {/* Stats Cards - Similar to Credit History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {t("credit.balance")}
              </p>
              <p className="text-2xl font-bold text-white">
                {balance.toLocaleString()}
              </p>
            </div>
            <Zap className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {t("services.cv_analysis.cost")}
              </p>
              <p className="text-2xl font-bold text-white">{CREDITS_COST}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">الحالة</p>
              <p
                className={`text-lg font-semibold ${
                  balance >= CREDITS_COST ? "text-green-400" : "text-red-400"
                }`}
              >
                {balance >= CREDITS_COST ? "جاهز للتحليل" : "رصيد غير كافي"}
              </p>
            </div>
            <AlertCircle
              className={`h-8 w-8 ${
                balance >= CREDITS_COST ? "text-green-400" : "text-red-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
        <div className="p-6 border-b border-slate-700 -m-6 mb-6">
          <h2 className="text-xl font-semibold text-white">
            {t("services.cv_analysis.analysis_details")}
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("services.cv_analysis.job_title")} *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t("form.placeholder.job_title")}
              dir={isRTL() ? "rtl" : "ltr"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("services.cv_analysis.job_description")} ({t("form.optional")})
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t("form.placeholder.job_description")}
              dir={isRTL() ? "rtl" : "ltr"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("services.cv_analysis.skills_required")} *
            </label>
            <textarea
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder={t("form.placeholder.skills_required")}
              dir={isRTL() ? "rtl" : "ltr"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("services.cv_analysis.upload_cv")} *
            </label>

            {/* Input Method Toggle */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setInputMethod("file")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === "file"
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  رفع ملف
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("text")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === "text"
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  إدخال نص
                </button>
              </div>
            </div>

            {/* File Upload */}
            {inputMethod === "file" && (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors bg-slate-900">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles(e.target.files)}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">
                    {t("services.cv_analysis.upload_instruction")}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t("services.cv_analysis.supported_formats")} أو صور
                    (JPG/PNG) - الآن يدعم استخراج النص من ملفات PDF!
                  </p>
                </label>
              </div>
            )}

            {/* Text Input */}
            {inputMethod === "text" && (
              <div className="border-2 border-slate-600 rounded-lg bg-slate-900">
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="انسخ والصق نص السيرة الذاتية هنا..."
                  dir={isRTL() ? "rtl" : "ltr"}
                />
              </div>
            )}

            {/* File Selection Info */}
            {inputMethod === "file" && files && files.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-400">
                  {files.length} {t("services.cv_analysis.files_selected")}
                </p>
              </div>
            )}

            {/* Text Input Info */}
            {inputMethod === "text" && cvText.trim() && (
              <div className="mt-3">
                <p className="text-sm text-gray-400">
                  تم إدخال {cvText.length} حرف
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={
          analyzing ||
          balance < CREDITS_COST ||
          !jobTitle.trim() ||
          !skillsRequired.trim() ||
          (inputMethod === "file" && (!files || files.length === 0)) ||
          (inputMethod === "text" && !cvText.trim())
        }
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {analyzing ? (
          <div
            className={`flex items-center justify-center ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${
                isRTL() ? "ml-2" : "mr-2"
              }`}
            ></div>
            {t("services.cv_analysis.analyzing")}
          </div>
        ) : (
          `${t("services.cv_analysis.start_analysis")} (${CREDITS_COST} ${t(
            "services.cv_analysis.cost"
          )})`
        )}
      </button>

      {/* Results */}
      {showResults && results.length > 0 && (
        <>
          {/* Results Header and Controls */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div
                className={`flex items-center ${
                  isRTL()
                    ? "flex-row-reverse space-x-reverse space-x-3"
                    : "space-x-3"
                }`}
              >
                <Users className="h-6 w-6 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">
                  نتائج تحليل السير الذاتية (
                  {getFilteredAndSortedResults().length})
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter by Score */}
                <div
                  className={`flex items-center ${
                    isRTL()
                      ? "flex-row-reverse space-x-reverse space-x-2"
                      : "space-x-2"
                  }`}
                >
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterByScore}
                    onChange={(e) => setFilterByScore(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">جميع التقييمات</option>
                    <option value="high">عالية (8+)</option>
                    <option value="medium">متوسطة (6-8)</option>
                    <option value="low">منخفضة (&lt;6)</option>
                  </select>
                </div>

                {/* Sort */}
                <div
                  className={`flex items-center ${
                    isRTL()
                      ? "flex-row-reverse space-x-reverse space-x-2"
                      : "space-x-2"
                  }`}
                >
                  <SortDesc className="h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="vote">حسب التقييم</option>
                    <option value="name">حسب الاسم</option>
                    <option value="ranking">حسب الترتيب</option>
                  </select>
                </div>

                {/* Export Buttons */}
                <div
                  className={`flex items-center gap-2 ${
                    isRTL() ? "flex-row-reverse" : ""
                  }`}
                >
                  <Download className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => handleExport("csv")}
                    disabled={exporting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {exporting ? "جاري التصدير..." : "CSV"}
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    disabled={exporting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {exporting ? "جاري التصدير..." : "JSON"}
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {exporting ? "جاري التصدير..." : "PDF"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {analyzing ? (
            <LoadingOverlay
              isVisible={analyzing}
              type="cv-analysis"
              onComplete={() => {
                // This will be called when the loading animation completes
                // The actual API call should be handled separately
              }}
            />
          ) : (
            <>
              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredAndSortedResults().map((candidate, index) => (
                  <CVAnalysisCard
                    key={index}
                    candidate={candidate}
                    index={index}
                  />
                ))}
              </div>

              {getFilteredAndSortedResults().length === 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    لا توجد نتائج تطابق الفلاتر المحددة
                  </h3>
                  <p className="text-gray-400">
                    جرب تغيير معايير التصفية أو البحث
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
