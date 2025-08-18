import React, { useState, useRef } from "react";
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
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import toast from "react-hot-toast";

interface CVFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: "file";
}

interface CVText {
  id: string;
  text: string;
  name: string;
  type: "text";
}

type CVItem = CVFile | CVText;

export function BulkCVAnalysisPage() {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance, deductCredits } = useCreditBalance();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [cvItems, setCvItems] = useState<CVItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState("vote");
  const [filterByScore, setFilterByScore] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CREDITS_COST_PER_CV = 5;

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: CVFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: "file" as const,
    }));

    setCvItems((prev) => [...prev, ...newFiles]);
  };

  const handleAddText = () => {
    const newText: CVText = {
      id: crypto.randomUUID(),
      text: "",
      name: `CV Text ${
        cvItems.filter((item) => item.type === "text").length + 1
      }`,
      type: "text" as const,
    };

    setCvItems((prev) => [...prev, newText]);
  };

  const handleRemoveItem = (id: string) => {
    setCvItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTextChange = (id: string, text: string) => {
    setCvItems((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "text" ? { ...item, text } : item
      )
    );
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast.error(t("error.unauthorized"));
      return;
    }

    const totalCvs = cvItems.length;
    const totalCost = totalCvs * CREDITS_COST_PER_CV;

    if (balance < totalCost) {
      toast.error(
        `Insufficient credits. Need ${totalCost} credits for ${totalCvs} CVs, but only have ${balance}`
      );
      return;
    }

    if (!jobTitle.trim() || !skillsRequired.trim() || cvItems.length === 0) {
      toast.error(t("error.validation"));
      return;
    }

    // Validate text CVs have content
    const textCvs = cvItems.filter((item) => item.type === "text");
    const emptyTextCvs = textCvs.filter((item) => !item.text.trim());
    if (emptyTextCvs.length > 0) {
      toast.error("Some text CVs are empty. Please fill them or remove them.");
      return;
    }

    setAnalyzing(true);
    setProgress({ current: 0, total: totalCvs });

    try {
      // Prepare CV files and texts
      const cvFiles: string[] = [];
      const cvTexts: string[] = [];

      for (const item of cvItems) {
        if (item.type === "file") {
          const base64File = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
          });
          cvFiles.push(base64File);
        } else {
          cvTexts.push(item.text);
        }
      }

      const requestBody = {
        cvFiles,
        cvTexts,
        jobTitle,
        jobDescription,
        skillsRequired,
        userId: user?.id,
      };

      // Call the bulk CV analysis Edge Function
      const { data, error } = await supabase.functions.invoke(
        "bulk-cv-analysis",
        {
          body: requestBody,
        }
      );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (!data || !data.data) {
        throw new Error("No data received from bulk analysis");
      }

      // Process results
      const successfulResults = data.data.results
        .filter((result: any) => result.status === "success")
        .map((result: any) => result.analysis);

      setResults(successfulResults);
      setShowResults(true);

      toast.success(
        `Bulk analysis completed! ${data.data.processedCvs}/${data.data.totalCvs} CVs analyzed successfully.`
      );
    } catch (error: any) {
      console.error("Bulk CV Analysis error:", error);
      toast.error(error.message || t("error.generic"));
    } finally {
      setAnalyzing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Filter and sort results
  const getFilteredAndSortedResults = () => {
    let filteredResults = [...results];

    if (filterByScore === "high") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) >= 8);
    } else if (filterByScore === "medium") {
      filteredResults = filteredResults.filter(
        (c) => parseInt(c.vote) >= 6 && parseInt(c.vote) < 8
      );
    } else if (filterByScore === "low") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) < 6);
    }

    if (sortBy === "vote") {
      filteredResults.sort((a, b) => parseInt(b.vote) - parseInt(a.vote));
    } else if (sortBy === "name") {
      filteredResults.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filteredResults;
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    setExporting(true);
    try {
      const fileName = `bulk-cv-analysis-${
        new Date().toISOString().split("T")[0]
      }`;

      // Import and use the same export utilities
      const { exportResults } = await import("../../utils/exportUtils");
      await exportResults(results, { format, fileName });

      toast.success(`Export successful! ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalCost = cvItems.length * CREDITS_COST_PER_CV;

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
              Bulk CV Analysis
            </h1>
            <p className="text-gray-400">
              Analyze multiple CVs simultaneously for efficient hiring
            </p>
          </div>
          <Link
            to="/dashboard/cv-analysis"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Single CV Analysis
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">Credit Balance</p>
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
              <p className="text-sm text-gray-400 mb-1">CVs to Analyze</p>
              <p className="text-2xl font-bold text-white">{cvItems.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-white">{totalCost}</p>
            </div>
            <FileText className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div
            className={`flex items-center justify-between ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="text-sm text-gray-400 mb-1">Status</p>
              <p
                className={`text-lg font-semibold ${
                  balance >= totalCost ? "text-green-400" : "text-red-400"
                }`}
              >
                {balance >= totalCost
                  ? "Ready for Analysis"
                  : "Insufficient Balance"}
              </p>
            </div>
            <AlertCircle
              className={`h-8 w-8 ${
                balance >= totalCost ? "text-green-400" : "text-red-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
        <div className="p-6 border-b border-slate-700 -m-6 mb-6">
          <h2 className="text-xl font-semibold text-white">Analysis Details</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Enter job title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Enter job description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Required Skills *
            </label>
            <textarea
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Enter required skills (comma-separated)"
              required
            />
          </div>

          {/* CV Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              CV Files and Texts *
            </label>

            {/* Upload Controls */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Files
              </button>
              <button
                type="button"
                onClick={handleAddText}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Text CV
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
            />

            {/* CV Items List */}
            {cvItems.length > 0 && (
              <div className="space-y-3">
                {cvItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-900 border border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {item.type === "file" ? (
                        <FileText className="h-5 w-5 text-blue-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        {item.type === "file" && (
                          <p className="text-sm text-gray-400">
                            {(item.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Text CV Inputs */}
            {cvItems
              .filter((item) => item.type === "text")
              .map((item) => (
                <div key={item.id} className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-400">
                      {item.name}
                    </label>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={item.text}
                    onChange={(e) => handleTextChange(item.id, e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Paste CV text here..."
                  />
                </div>
              ))}
          </div>
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
          cvItems.length === 0
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
            Analyzing {progress.current}/{progress.total} CVs...
          </div>
        ) : (
          `Start Bulk Analysis (${totalCost} credits for ${cvItems.length} CVs)`
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
                  Bulk Analysis Results ({getFilteredAndSortedResults().length})
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
                    <option value="all">All Ratings</option>
                    <option value="high">High (8+)</option>
                    <option value="medium">Medium (6-8)</option>
                    <option value="low">Low (&lt;6)</option>
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
                    <option value="vote">By Rating</option>
                    <option value="name">By Name</option>
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
                    {exporting ? "Exporting..." : "CSV"}
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    disabled={exporting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {exporting ? "Exporting..." : "JSON"}
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {exporting ? "Exporting..." : "PDF"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAndSortedResults().map((candidate, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {candidate.name}
                    </h3>
                    <p className="text-sm text-gray-400">{candidate.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-cyan-400">
                      {candidate.vote}/10
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">{candidate.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">City</p>
                    <p className="text-white">{candidate.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Skills</p>
                    <p className="text-white text-sm">{candidate.skills}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Summary</p>
                    <p className="text-white text-sm line-clamp-3">
                      {candidate.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredAndSortedResults().length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No results match the selected filters
              </h3>
              <p className="text-gray-400">
                Try changing the filters to see more results
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
