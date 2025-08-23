import React from "react";
import { Link } from "react-router-dom";
import { Search, Zap } from "lucide-react";
import { useTranslation } from "../../../lib/i18n";

interface TalentSearchHeaderProps {
  isRTL: boolean;
}

export const TalentSearchHeader: React.FC<TalentSearchHeaderProps> = ({
  isRTL,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div
        className={`flex items-center justify-between ${
          isRTL ? "flex-row-reverse" : ""
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
          <Search className="h-4 w-4 mr-2" />
          {t("services.talent_search.history")}
        </Link>
      </div>
    </div>
  );
};
