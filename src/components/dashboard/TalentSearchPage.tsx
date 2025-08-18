import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Zap,
  AlertCircle,
  MapPin,
  GraduationCap,
  Award,
  Languages,
  Filter,
  SortDesc,
  Users,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../lib/i18n";
import { useCreditBalance } from "../../hooks/useCreditBalance";
import { CandidateCard } from "../ui/CandidateCard";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import toast from "react-hot-toast";

// Match score types with costs
const MATCH_SCORE_TYPES = {
  quick: { percentage: 50, baseCost: 10, extraCost: 0, total: 10 },
  balanced: { percentage: 60, baseCost: 10, extraCost: 5, total: 15 },
  detailed: { percentage: 70, baseCost: 10, extraCost: 10, total: 20 },
  comprehensive: { percentage: 80, baseCost: 10, extraCost: 15, total: 25 },
};

export function TalentSearchPage() {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { balance, deductCredits } = useCreditBalance();

  // Form fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [certifications, setCertifications] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [languages, setLanguages] = useState("");
  const [numberOfCandidates, setNumberOfCandidates] = useState(5);
  const [matchScoreType, setMatchScoreType] = useState("balanced");

  // Search state
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState("match_score");
  const [filterByScore, setFilterByScore] = useState("all");

  // Calculate total cost
  const [totalCost, setTotalCost] = useState(0);

  // Calculate total cost when inputs change
  useEffect(() => {
    const scoreTypeData =
      MATCH_SCORE_TYPES[matchScoreType as keyof typeof MATCH_SCORE_TYPES];
    const cost = numberOfCandidates * scoreTypeData.total;
    setTotalCost(cost);
  }, [numberOfCandidates, matchScoreType]);

  const handleSearch = async () => {
    if (!user) {
      toast.error(t("error.unauthorized"));
      return;
    }

    if (balance < totalCost) {
      toast.error(t("credit.insufficient"));
      return;
    }

    if (!jobTitle.trim() || !skillsRequired.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    setSearching(true);

    try {
      // Add a minimum delay to show the loading animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

      // Call the Edge Function for real AI processing
      const searchPromise = supabase.functions.invoke("talent-search", {
        body: {
          jobTitle,
          jobDescription,
          skillsRequired,
          certifications,
          educationLevel,
          languages,
          numberOfCandidates,
          matchScoreType,
        },
      });

      // Wait for both the minimum delay and the actual API call
      const [data, error] = await Promise.all([searchPromise, minDelay]).then(
        ([result]) => [result.data, result.error]
      );

      if (error) {
        throw error;
      }

      // Check for error in response body (since we now return 200 status for errors)
      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (!data || !data.data || !data.data.candidates) {
        throw new Error("لم يتم العثور على نتائج");
      }

      // Update local balance
      const newBalance = data.data.remainingCredits;
      // You might need to update your credit balance hook here

      setResults(data.data.candidates);
      setShowResults(true);
      toast.success(
        `${t("services.talent_search.candidates_found")}: ${
          data.data.candidates.length
        }!`
      );
    } catch (error: any) {
      console.error("Talent Search error:", error);
      toast.error(error.message || t("error.generic"));
    } finally {
      setSearching(false);
    }
  };

  // Filter and sort results
  const getFilteredAndSortedResults = () => {
    let filteredResults = [...results];

    // Filter by score
    if (filterByScore === "high") {
      filteredResults = filteredResults.filter((c) => c.match_score >= 80);
    } else if (filterByScore === "medium") {
      filteredResults = filteredResults.filter(
        (c) => c.match_score >= 60 && c.match_score < 80
      );
    } else if (filterByScore === "low") {
      filteredResults = filteredResults.filter((c) => c.match_score < 60);
    }

    // Sort results
    if (sortBy === "match_score") {
      filteredResults.sort((a, b) => b.match_score - a.match_score);
    } else if (sortBy === "name") {
      filteredResults.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    return filteredResults;
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
              {t("services.talent_search.title")}
            </h1>
            <p className="text-gray-400">
              {t("services.talent_search.description")}
            </p>
          </div>
          <Link
            to="/dashboard/talent-search-history"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            {t("dashboard.talent_search_history")}
          </Link>
        </div>
      </div>

      {/* Current Balance Display */}
      {user && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-700">
            <Zap className="h-6 w-6 text-cyan-400 ml-2" />
            <span className="text-white font-medium">
              {t("current_balance")}: {balance?.toLocaleString() || 0}{" "}
              {t("credit.balance")}
            </span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-slate-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          {t("services.talent_search.title")}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {t("services.talent_search.description")}
        </p>

        <div className="space-y-8">
          {/* Job Details Section */}
          <div className="bg-[#10172A] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-[#38BDF8]" />
              Job Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                  {t("services.talent_search.job_title")} *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                  placeholder={t("form.placeholder.job_title")}
                  dir={isRTL() ? "rtl" : "ltr"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                  {t("services.talent_search.job_description")} (
                  {t("form.optional")})
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                  placeholder={t("form.placeholder.job_description")}
                  dir={isRTL() ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </div>

          {/* Candidate Requirements Section */}
          <div className="bg-[#10172A] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-[#38BDF8]" />
              {t("services.talent_search.candidate_requirements")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                  {t("services.talent_search.skills_required")} *
                </label>
                <textarea
                  value={skillsRequired}
                  onChange={(e) => setSkillsRequired(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                  placeholder={t("form.placeholder.skills_required")}
                  dir={isRTL() ? "rtl" : "ltr"}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                    {t("services.talent_search.certifications")} (
                    {t("form.optional")})
                  </label>
                  <input
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                    placeholder={t("form.placeholder.certifications")}
                    dir={isRTL() ? "rtl" : "ltr"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                    {t("services.talent_search.languages")} (
                    {t("form.optional")})
                  </label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                    placeholder={t("form.placeholder.languages")}
                    dir={isRTL() ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                  {t("services.talent_search.education_level")} (
                  {t("form.optional")})
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                >
                  <option value="">{t("form.select_education")}</option>
                  <option value="high_school">{t("form.high_school")}</option>
                  <option value="bachelor">{t("form.bachelor")}</option>
                  <option value="master">{t("form.master")}</option>
                  <option value="phd">{t("form.phd")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Settings Section */}
          <div className="bg-[#10172A] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-[#38BDF8]" />
              {t("services.talent_search.search_settings")}
            </h3>

            <div className="space-y-6">
              {/* Number of Candidates */}
              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">
                  {t("services.talent_search.number_of_candidates")} *
                </label>
                <select
                  value={numberOfCandidates}
                  onChange={(e) =>
                    setNumberOfCandidates(parseInt(e.target.value))
                  }
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]"
                >
                  <option value={5}>
                    5 {t("services.talent_search.candidates")}
                  </option>
                  <option value={10}>
                    10 {t("services.talent_search.candidates")}
                  </option>
                  <option value={15}>
                    15 {t("services.talent_search.candidates")}
                  </option>
                  <option value={20}>
                    20 {t("services.talent_search.candidates")}
                  </option>
                </select>
              </div>

              {/* Match Score Selection */}
              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-4">
                  {t("services.talent_search.match_score_type")} *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quick Search */}
                  <div
                    onClick={() => setMatchScoreType("quick")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      matchScoreType === "quick"
                        ? "border-[#22C55E] bg-[#10172A] shadow-lg ring-2 ring-[#22C55E]/20"
                        : "border-[#334155] bg-[#1E293B] hover:border-[#22C55E]/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🟢</div>
                      <h4 className="font-semibold text-[#F8FAFC] mb-1">
                        {t("services.talent_search.quick_search")}
                      </h4>
                      <div className="text-sm text-[#CBD5E1] mb-2">50%</div>
                      <div className="text-xs text-[#94A3B8] mb-2">
                        {t("services.talent_search.quick_description")}
                      </div>
                      <div className="font-bold text-[#22C55E]">
                        10 {t("credit.balance")}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {t("services.talent_search.per_candidate")}
                      </div>
                    </div>
                  </div>

                  {/* Balanced Search */}
                  <div
                    onClick={() => setMatchScoreType("balanced")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      matchScoreType === "balanced"
                        ? "border-[#38BDF8] bg-[#10172A] shadow-lg ring-2 ring-[#38BDF8]/20"
                        : "border-[#334155] bg-[#1E293B] hover:border-[#38BDF8]/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔵</div>
                      <h4 className="font-semibold text-[#F8FAFC] mb-1">
                        {t("services.talent_search.balanced_search")}
                      </h4>
                      <div className="text-sm text-[#CBD5E1] mb-2">60%</div>
                      <div className="text-xs text-[#94A3B8] mb-2">
                        {t("services.talent_search.balanced_description")}
                      </div>
                      <div className="font-bold text-[#38BDF8]">
                        15 {t("credit.balance")}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {t("services.talent_search.per_candidate")}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Search */}
                  <div
                    onClick={() => setMatchScoreType("detailed")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      matchScoreType === "detailed"
                        ? "border-[#EAB308] bg-[#10172A] shadow-lg ring-2 ring-[#EAB308]/20"
                        : "border-[#334155] bg-[#1E293B] hover:border-[#EAB308]/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🟡</div>
                      <h4 className="font-semibold text-[#F8FAFC] mb-1">
                        {t("services.talent_search.detailed_search")}
                      </h4>
                      <div className="text-sm text-[#CBD5E1] mb-2">70%</div>
                      <div className="text-xs text-[#94A3B8] mb-2">
                        {t("services.talent_search.detailed_description")}
                      </div>
                      <div className="font-bold text-[#EAB308]">
                        20 {t("credit.balance")}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {t("services.talent_search.per_candidate")}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Search */}
                  <div
                    onClick={() => setMatchScoreType("comprehensive")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      matchScoreType === "comprehensive"
                        ? "border-[#F43F5E] bg-[#10172A] shadow-lg ring-2 ring-[#F43F5E]/20"
                        : "border-[#334155] bg-[#1E293B] hover:border-[#F43F5E]/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔴</div>
                      <h4 className="font-semibold text-[#F8FAFC] mb-1">
                        {t("services.talent_search.comprehensive_search")}
                      </h4>
                      <div className="text-sm text-[#CBD5E1] mb-2">80%</div>
                      <div className="text-xs text-[#94A3B8] mb-2">
                        {t("services.talent_search.comprehensive_description")}
                      </div>
                      <div className="font-bold text-[#F43F5E]">
                        25 {t("credit.balance")}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {t("services.talent_search.per_candidate")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Time Notice */}
                <div className="mt-4 p-3 bg-[#10172A] border border-[#EAB308] rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-[#EAB308] mr-2" />
                    <span className="text-sm text-[#EAB308]">
                      {t("services.talent_search.processing_notice")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-[#38BDF8]" />
              {t("services.talent_search.cost_summary")}
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[#CBD5E1]">
                <span>{t("services.talent_search.number_of_candidates")}:</span>
                <span className="font-medium">{numberOfCandidates}</span>
              </div>
              <div className="flex justify-between items-center text-[#CBD5E1]">
                <span>{t("services.talent_search.cost_per_candidate")}:</span>
                <span className="font-medium">
                  {
                    MATCH_SCORE_TYPES[
                      matchScoreType as keyof typeof MATCH_SCORE_TYPES
                    ].total
                  }{" "}
                  {t("credit.balance")}
                </span>
              </div>
              <div className="border-t border-[#334155] pt-2 mt-2">
                <div className="flex justify-between items-center text-lg font-bold text-[#38BDF8]">
                  <span>{t("services.talent_search.total_cost")}:</span>
                  <span>
                    {totalCost.toLocaleString()} {t("credit.balance")}
                  </span>
                </div>
              </div>

              {/* Current Balance Check */}
              {balance < totalCost && (
                <div className="mt-3 p-3 bg-[#10172A] border border-[#F43F5E] rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-[#F43F5E] mr-2" />
                    <span className="text-sm text-[#F43F5E]">
                      {t("credit.insufficient")} - {t("current_balance")}:{" "}
                      {balance?.toLocaleString() || 0} {t("credit.balance")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={handleSearch}
            disabled={
              searching ||
              balance < totalCost ||
              !jobTitle.trim() ||
              !skillsRequired.trim()
            }
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
              searching ||
              balance < totalCost ||
              !jobTitle.trim() ||
              !skillsRequired.trim()
                ? "bg-[#94A3B8] cursor-not-allowed"
                : "bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            }`}
          >
            {searching ? (
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
                {t("services.talent_search.searching")}
              </div>
            ) : (
              `${t(
                "services.talent_search.start_search"
              )} (${totalCost.toLocaleString()} ${t("credit.balance")})`
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="mt-8">
          {/* Results Header */}
          <div className="bg-[#1E293B] backdrop-blur-sm rounded-xl p-6 border border-[#334155] mb-6">
            <div
              className={`flex items-center justify-between mb-4 ${
                isRTL() ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex items-center ${
                  isRTL()
                    ? "flex-row-reverse space-x-reverse space-x-3"
                    : "space-x-3"
                }`}
              >
                <Users className="h-6 w-6 text-[#38BDF8]" />
                <h3 className="text-xl font-semibold text-[#F8FAFC]">
                  نتائج البحث ({getFilteredAndSortedResults().length} مرشح)
                </h3>
              </div>

              {/* Filter Controls */}
              <div
                className={`flex items-center gap-4 ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex items-center ${
                    isRTL()
                      ? "flex-row-reverse space-x-reverse space-x-2"
                      : "space-x-2"
                  }`}
                >
                  <Filter className="h-4 w-4 text-[#94A3B8]" />
                  <select
                    value={filterByScore}
                    onChange={(e) => setFilterByScore(e.target.value)}
                    className="bg-[#10172A] border border-[#334155] rounded-md px-3 py-1 text-sm text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  >
                    <option value="all">جميع المطابقات</option>
                    <option value="high">عالية (80%+)</option>
                    <option value="medium">متوسطة (60-79%)</option>
                    <option value="low">منخفضة (أقل من 60%)</option>
                  </select>
                </div>

                <div
                  className={`flex items-center ${
                    isRTL()
                      ? "flex-row-reverse space-x-reverse space-x-2"
                      : "space-x-2"
                  }`}
                >
                  <SortDesc className="h-4 w-4 text-[#94A3B8]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#10172A] border border-[#334155] rounded-md px-3 py-1 text-sm text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  >
                    <option value="match_score">نسبة المطابقة</option>
                    <option value="name">الاسم</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg p-3 text-center">
                <div className="text-[#22C55E] text-2xl font-bold">
                  {
                    getFilteredAndSortedResults().filter(
                      (c) => c["Match Score (0-100)"] >= 80
                    ).length
                  }
                </div>
                <div className="text-[#22C55E] text-sm">مطابقة عالية</div>
              </div>
              <div className="bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-lg p-3 text-center">
                <div className="text-[#EAB308] text-2xl font-bold">
                  {
                    getFilteredAndSortedResults().filter(
                      (c) =>
                        c["Match Score (0-100)"] >= 60 &&
                        c["Match Score (0-100)"] < 80
                    ).length
                  }
                </div>
                <div className="text-[#EAB308] text-sm">مطابقة متوسطة</div>
              </div>
              <div className="bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-lg p-3 text-center">
                <div className="text-[#F43F5E] text-2xl font-bold">
                  {
                    getFilteredAndSortedResults().filter(
                      (c) => c["Match Score (0-100)"] < 60
                    ).length
                  }
                </div>
                <div className="text-[#F43F5E] text-sm">مطابقة منخفضة</div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {searching ? (
            <LoadingOverlay
              isVisible={searching}
              type="talent-search"
              onComplete={() => {
                // This will be called when the loading animation completes
                // The actual API call should be handled separately
              }}
            />
          ) : (
            <>
              {/* Candidates Grid */}
              {getFilteredAndSortedResults().length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getFilteredAndSortedResults().map((candidate, index) => (
                    <CandidateCard
                      key={index}
                      candidate={candidate}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#1E293B] backdrop-blur-sm rounded-xl p-8 border border-[#334155] text-center">
                  <Users className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#F8FAFC] mb-2">
                    لا توجد نتائج
                  </h3>
                  <p className="text-gray-400">
                    لم يتم العثور على مرشحين يطابقون معايير البحث المحددة.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
