import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Users } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { useCVAnalysis } from "../../hooks/useCVAnalysis";
import { CVAnalysisCard } from "../ui/CVAnalysisCard";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { exportResults } from "../../utils/exportUtils";
import { CVUploadForm, UploadedFile } from "./CVUploadForm";
import { CVStatsCards } from "./CVStatsCards";
import { CVResultsHeader } from "./CVResultsHeader";
import toast from "react-hot-toast";

export function CVAnalysisPage() {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance } = useCreditBalance();
  const {
    analyzing,
    results,
    showResults,
    setShowResults,
    analyzeCVs,
    getFilteredAndSortedResults,
  } = useCVAnalysis();

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [cvTexts, setCvTexts] = useState<string[]>([""]);
  const [inputMethod, setInputMethod] = useState<"file" | "text" | "mixed">(
    "file"
  );

  // Results state
  const [sortBy, setSortBy] = useState("vote");
  const [filterByScore, setFilterByScore] = useState("all");
  const [exporting, setExporting] = useState(false);

  const CREDITS_COST = 5;

  // Calculate total cost based on number of CVs
  const getTotalCost = () => {
    const fileCount = uploadedFiles.length;
    const textCount = cvTexts.filter((text) => text.trim()).length;
    return (fileCount + textCount) * CREDITS_COST;
  };

  const totalCost = getTotalCost();
  const validTextsCount = cvTexts.filter((text) => text.trim()).length;

  const handleAnalyze = () => {
    if (balance < totalCost) {
      toast.error(t("credit.insufficient"));
      return;
    }

    analyzeCVs(
      jobTitle,
      jobDescription,
      skillsRequired,
      uploadedFiles,
      cvTexts
    );
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
      toast.success(
        `${t("services.cv_analysis.export_success")} ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("services.cv_analysis.export_failed"));
    } finally {
      setExporting(false);
    }
  };

  const filteredResults = getFilteredAndSortedResults(
    results,
    filterByScore,
    sortBy
  );

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

      {/* Stats Cards */}
      <CVStatsCards
        balance={balance}
        totalCost={totalCost}
        uploadedFilesCount={uploadedFiles.length}
        cvTextsCount={validTextsCount}
        creditsCost={CREDITS_COST}
      />

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

          <CVUploadForm
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            cvTexts={cvTexts}
            setCvTexts={setCvTexts}
            inputMethod={inputMethod}
            setInputMethod={setInputMethod}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={
          analyzing ||
          balance < totalCost ||
          !jobTitle.trim() ||
          !skillsRequired.trim() ||
          (uploadedFiles.length === 0 && validTextsCount === 0)
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
          `${t("services.cv_analysis.start_analysis")} (${totalCost} ${t(
            "services.cv_analysis.cost"
          )})`
        )}
      </button>

      {/* Results */}
      {showResults && results.length > 0 && (
        <>
          {/* Results Header and Controls */}
          <CVResultsHeader
            resultsCount={filteredResults.length}
            filterByScore={filterByScore}
            setFilterByScore={setFilterByScore}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onExport={handleExport}
            exporting={exporting}
          />

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
                {filteredResults.map((candidate, index) => (
                  <CVAnalysisCard
                    key={index}
                    candidate={candidate}
                    index={index}
                  />
                ))}
              </div>

              {filteredResults.length === 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    لا توجد نتائج تطابق الفلاتر المحددة
                  </h3>
                  <p className="text-gray-400">
                    {t("services.cv_analysis.try_changing_filters")}
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
