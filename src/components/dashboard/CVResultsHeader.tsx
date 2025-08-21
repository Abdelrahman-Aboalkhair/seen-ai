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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div
          className={`flex items-center ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-3" : "space-x-3"
          }`}
        >
          <Users className="h-6 w-6 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">
            {t("services.cv_analysis.cv_analysis_results")} ({resultsCount})
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
              onClick={() => onExport("csv")}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {exporting ? t("services.cv_analysis.exporting") : "CSV"}
            </button>
            <button
              onClick={() => onExport("json")}
              disabled={exporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {exporting ? t("services.cv_analysis.exporting") : "JSON"}
            </button>
            <button
              onClick={() => onExport("pdf")}
              disabled={exporting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-xs px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {exporting ? t("services.cv_analysis.exporting") : "PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
