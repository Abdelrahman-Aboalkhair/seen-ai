import { Users, Filter, SortDesc, Download } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CVResultsHeaderProps {
  resultsCount: number;
  filterByScore: string;
  setFilterByScore: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onExport: (format: "csv" | "json" | "pdf") => void;
  exporting: boolean;
}

export function CVResultsHeader({
  resultsCount,
  filterByScore,
  setFilterByScore,
  sortBy,
  setSortBy,
  onExport,
  exporting,
}: CVResultsHeaderProps) {
  const { t, isRTL } = useTranslation();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mb-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Section - Title and Count */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("services.cv_analysis.cv_analysis_results")}
            </h2>
            <p className="text-sm text-gray-400">
              {resultsCount} {resultsCount === 1 ? "مرشح" : "مرشحين"}
            </p>
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterByScore}
                onChange={(e) => setFilterByScore(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none cursor-pointer appearance-none pr-2"
              >
                <option value="all">جميع التقييمات</option>
                <option value="high">عالية (8+)</option>
                <option value="medium">متوسطة (6-8)</option>
                <option value="low">منخفضة (&lt;6)</option>
              </select>
              <div className="w-2 h-2 border-r border-t border-gray-400 transform rotate-45 pointer-events-none"></div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors">
              <SortDesc className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none cursor-pointer appearance-none pr-2"
              >
                <option value="vote">حسب التقييم</option>
                <option value="name">حسب الاسم</option>
                <option value="ranking">حسب الترتيب</option>
              </select>
              <div className="w-2 h-2 border-r border-t border-gray-400 transform rotate-45 pointer-events-none"></div>
            </div>
          </div>

          {/* Export Section */}
          <div className="flex items-center space-x-1">
            <div className="w-px h-6 bg-slate-600 mx-2"></div>
            <Download className="h-4 w-4 text-gray-400" />
            <div className="flex space-x-1">
              <button
                onClick={() => onExport("csv")}
                disabled={exporting}
                className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 disabled:bg-slate-600/20 text-green-400 hover:text-green-300 disabled:text-gray-500 text-xs rounded-md transition-all duration-200 disabled:cursor-not-allowed border border-green-600/30"
                title="تصدير CSV"
              >
                {exporting ? "..." : "CSV"}
              </button>
              <button
                onClick={() => onExport("json")}
                disabled={exporting}
                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-slate-600/20 text-blue-400 hover:text-blue-300 disabled:text-gray-500 text-xs rounded-md transition-all duration-200 disabled:cursor-not-allowed border border-blue-600/30"
                title="تصدير JSON"
              >
                {exporting ? "..." : "JSON"}
              </button>
              <button
                onClick={() => onExport("pdf")}
                disabled={exporting}
                className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 disabled:bg-slate-600/20 text-red-400 hover:text-red-300 disabled:text-gray-500 text-xs rounded-md transition-all duration-200 disabled:cursor-not-allowed border border-red-600/30"
                title="تصدير PDF"
              >
                {exporting ? "..." : "PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
