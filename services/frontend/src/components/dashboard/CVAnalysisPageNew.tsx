// New CV Analysis Page using our custom backend API

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { useCVAnalysisAPI } from "../../hooks/useCVAnalysisAPI";
import { useCVAnalysisStore } from "../../stores/cvAnalysisStore";
import { CVAnalysisCard } from "../ui/CVAnalysisCard";
import { CVStatsCards } from "./CVStatsCards";
import { CVResultsHeader } from "./CVResultsHeader";
import { CVUploadForm } from "./CVUploadForm";
import toast from "react-hot-toast";

export function CVAnalysisPageNew() {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance } = useCreditBalance();

  // API hooks
  const {
    startAsyncAnalysis,
    startAsyncAnalysisFromFile,
    useJobStatus,
    isCreatingJob,
    isCreatingFileJob,
    createJobError,
    createFileJobError,
  } = useCVAnalysisAPI();

  // Zustand store
  const {
    // State
    currentJobId,
    isAnalyzing,
    analysisProgress,
    results,
    showResults,
    jobTitle,
    jobDescription,
    skillsRequired,
    cvText,
    uploadedFiles,
    inputMethod,
    sortBy,
    filterByScore,

    // Actions
    setCurrentJob,
    setAnalyzing,
    setAnalysisProgress,
    setResults,
    setShowResults,
    addResult,
    clearResults,
    setJobTitle,
    setJobDescription,
    setSkillsRequired,
    setCVText,
    resetForm,
    setSortBy,
    setFilterByScore,

    // Computed
    getFilteredAndSortedResults,
    getTotalCost,
  } = useCVAnalysisStore();

  // Job status query (only enabled when we have a job ID)
  const jobStatusQuery = useJobStatus(currentJobId || null, !!currentJobId);

  // Debug logging for currentJobId changes
  useEffect(() => {
    console.log("🔄 [Frontend Component] currentJobId changed:", {
      currentJobId,
      timestamp: new Date().toISOString(),
    });
  }, [currentJobId]);

  // Monitor job status and update progress
  useEffect(() => {
    console.log("🔄 [Frontend Component] Job status effect triggered:", {
      hasData: !!jobStatusQuery.data,
      success: jobStatusQuery.data?.success,
      currentJobId,
      timestamp: new Date().toISOString(),
    });

    if (jobStatusQuery.data?.success && currentJobId) {
      const jobData = jobStatusQuery.data.data;
      console.log("📊 [Frontend Component] Processing job data:", {
        jobId: currentJobId,
        status: jobData?.status,
        progress: jobData?.progress,
        hasResult: !!jobData?.result,
        hasError: !!jobData?.error,
      });

      if (jobData) {
        // Update progress
        if (jobData.progress !== undefined) {
          console.log(
            "📈 [Frontend Component] Updating progress:",
            jobData.progress
          );
          setAnalysisProgress(jobData.progress);
        }

        // Handle completed job
        if (jobData.status === "completed" && jobData.result) {
          console.log("✅ [Frontend Component] Job completed, adding result");
          setAnalyzing(false);
          setCurrentJob(null);
          addResult(jobData.result);
          toast.success("CV analysis completed successfully!");
        }

        // Handle failed job
        if (jobData.status === "failed") {
          console.log("❌ [Frontend Component] Job failed:", jobData.error);
          setAnalyzing(false);
          setCurrentJob(null);
          toast.error(jobData.error || "CV analysis failed");
        }

        // Handle processing job
        if (jobData.status === "processing") {
          console.log("⚙️ [Frontend Component] Job is processing");
          setAnalyzing(true);
        }
      }
    }
  }, [
    jobStatusQuery.data,
    currentJobId,
    setAnalyzing,
    setCurrentJob,
    addResult,
    setAnalysisProgress,
  ]);

  // Handle analysis start
  const handleAnalyze = async () => {
    console.log("🚀 [Frontend Component] handleAnalyze called:", {
      balance,
      requiredCost: getTotalCost(),
      hasJobTitle: !!jobTitle.trim(),
      hasSkills: !!skillsRequired.trim(),
      hasCVText: !!cvText.trim(),
      timestamp: new Date().toISOString(),
    });

    if (balance < getTotalCost()) {
      console.log("❌ [Frontend Component] Insufficient credits");
      toast.error("Insufficient credits");
      return;
    }

    // Validate required fields based on input method
    if (!jobTitle.trim() || !skillsRequired.trim()) {
      console.log("❌ [Frontend Component] Missing required fields");
      toast.error("Please fill in job title and skills required");
      return;
    }

    // Check if we have CV content based on input method
    const hasCVContent =
      (inputMethod === "text" && cvText.trim()) ||
      (inputMethod === "file" && uploadedFiles.length > 0) ||
      (inputMethod === "mixed" && (cvText.trim() || uploadedFiles.length > 0));

    if (!hasCVContent) {
      console.log("❌ [Frontend Component] No CV content provided");
      toast.error("Please provide CV content (text or file upload)");
      return;
    }

    try {
      console.log("🔧 [Frontend Component] Starting analysis...");
      setAnalyzing(true);
      clearResults();

      // Create job requirements string
      const jobRequirements = `${jobTitle}\n\n${jobDescription}\n\nRequired Skills: ${skillsRequired}`;
      console.log("📝 [Frontend Component] Job requirements created:", {
        length: jobRequirements.length,
        preview: jobRequirements.substring(0, 100) + "...",
      });

      // Start async analysis
      console.log("📡 [Frontend Component] Calling startAsyncAnalysis...");

      // Prepare CV content based on input method
      let finalCVText = "";
      let response;

      if (inputMethod === "file" && uploadedFiles.length > 0) {
        // Use file upload endpoint
        const file = uploadedFiles[0];
        console.log("📁 [Frontend Component] Using file upload for analysis:", {
          filename: file.file.name,
          size: file.file.size,
          type: file.file.type,
        });

        response = await startAsyncAnalysisFromFile(file.file, jobRequirements);
      } else if (inputMethod === "text" && cvText.trim()) {
        // Use text input
        finalCVText = cvText;
        console.log("📝 [Frontend Component] Using text input for analysis");
        response = await startAsyncAnalysis(finalCVText, jobRequirements);
      } else if (inputMethod === "mixed") {
        // Handle mixed mode - prioritize file if available
        if (uploadedFiles.length > 0) {
          const file = uploadedFiles[0];
          console.log(
            "📁 [Frontend Component] Using file upload (mixed mode):",
            {
              filename: file.file.name,
              size: file.file.size,
              type: file.file.type,
            }
          );

          response = await startAsyncAnalysisFromFile(
            file.file,
            jobRequirements
          );

          // Add text input if available
          if (cvText.trim()) {
            console.log(
              "📝 [Frontend Component] Text input available, but using file for now"
            );
            // Note: In the future, we could combine both by sending text as additional context
          }
        } else {
          finalCVText = cvText;
          console.log(
            "📝 [Frontend Component] Using text input for analysis (mixed mode)"
          );
          response = await startAsyncAnalysis(finalCVText, jobRequirements);
        }
      } else {
        throw new Error("No valid CV content provided");
      }

      console.log("📊 [Frontend Component] Analysis response:", {
        success: response.success,
        jobId: response.data?.jobId,
        error: response.error,
      });

      if (response.success) {
        console.log(
          "✅ [Frontend Component] Analysis started successfully, setting current job"
        );
        setCurrentJob(response.data.jobId);
        toast.success("CV analysis started! This may take a few minutes.");
      } else {
        console.log("❌ [Frontend Component] Analysis failed to start");
        setAnalyzing(false);
        toast.error(response.error || "Failed to start analysis");
      }
    } catch (error) {
      console.error("❌ [Frontend Component] Analysis error:", error);
      setAnalyzing(false);
      toast.error("Failed to start CV analysis");
    }
  };

  // Handle export
  const handleExport = async (format: "csv" | "json" | "pdf") => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    // TODO: Implement export functionality
    toast.success(`Export to ${format.toUpperCase()} not yet implemented`);
  };

  const filteredResults = getFilteredAndSortedResults();
  const totalCost = getTotalCost();

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
        cvTextsCount={cvText.trim() ? 1 : 0}
        creditsCost={5}
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

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              CV Content *
            </label>
            <CVUploadForm />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={
          isAnalyzing ||
          balance < totalCost ||
          !jobTitle.trim() ||
          !skillsRequired.trim() ||
          ((inputMethod === "text" || inputMethod === "mixed") &&
            !cvText.trim()) ||
          ((inputMethod === "file" || inputMethod === "mixed") &&
            uploadedFiles.length === 0)
        }
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {isAnalyzing ? (
          <div
            className={`flex items-center justify-center ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <Loader2
              className={`animate-spin h-5 w-5 ${isRTL() ? "ml-2" : "mr-2"}`}
            />
            Analyzing CV... {analysisProgress}%
          </div>
        ) : (
          `Start Analysis (${totalCost} credits)`
        )}
      </button>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="mt-4 bg-slate-700 rounded-full h-2">
          <div
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>
      )}

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
            exporting={false}
          />

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((result, index) => (
              <CVAnalysisCard
                key={index}
                candidate={{
                  name: `Candidate ${index + 1}`,
                  vote: result.score.toString(),
                  ranking: result.matchPercentage,
                  summary: result.summary,
                  analysis: {
                    skillsMatch: result.keySkills.join(", "),
                    experienceMatch: `${result.experience.years} years`,
                    educationMatch: result.education.degree,
                    cultureFit: "Good",
                    strengths: result.strengths,
                    gaps: result.weaknesses,
                  },
                  candidate: {
                    name: `Candidate ${index + 1}`,
                    headline: `${result.experience.years} years experience`,
                    profileUrl: "#",
                  },
                }}
                index={index}
              />
            ))}
          </div>

          {filteredResults.length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No results match the selected filters
              </h3>
              <p className="text-gray-400">
                Try changing your filters to see more results
              </p>
            </div>
          )}
        </>
      )}

      {/* Error Display */}
      {createJobError && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">
            Error: {createJobError.message || "Failed to create analysis job"}
          </p>
        </div>
      )}
    </div>
  );
}
