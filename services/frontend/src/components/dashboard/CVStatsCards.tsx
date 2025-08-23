import { Zap, FileText, AlertCircle } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CVStatsCardsProps {
  balance: number;
  totalCost: number;
  uploadedFilesCount: number;
  cvTextsCount: number;
  creditsCost: number;
}

export function CVStatsCards({
  balance,
  totalCost,
  uploadedFilesCount,
  cvTextsCount,
  creditsCost,
}: CVStatsCardsProps) {
  const { t, isRTL } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div
          className={`flex items-center justify-between ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <div>
            <p className="text-sm text-gray-400 mb-1">{t("credit.balance")}</p>
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
            <p className="text-2xl font-bold text-white">{totalCost}</p>
            <p className="text-xs text-gray-500">
              {uploadedFilesCount + cvTextsCount} CV(s) × {creditsCost} credits
            </p>
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
                balance >= totalCost ? "text-green-400" : "text-red-400"
              }`}
            >
              {balance >= totalCost
                ? t("services.cv_analysis.ready_for_analysis")
                : t("services.cv_analysis.insufficient_balance")}
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
  );
}
