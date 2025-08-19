import React from "react";
import { TalentSearchHeader } from "./TalentSearchHeader";
import { SearchForm } from "./SearchForm";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { LoadingOverlay } from "./LoadingOverlay";
import { useTalentSearch } from "../hooks/useTalentSearch";
import { useSearchFilters } from "../hooks/useSearchFilters";
import { useTranslation } from "../../../lib/i18n";

export const TalentSearchPage: React.FC = () => {
  const { t, isRTL } = useTranslation();

  const {
    formData,
    updateFormData,
    searching,
    results,
    showResults,
    totalCost,
    balance,
    handleSearch,
    resetSearch,
    applyRequirements,
  } = useTalentSearch();

  const {
    filters,
    updateFilters,
    filteredAndSortedResults,
    uniqueLocations,
    experienceRanges,
  } = useSearchFilters(results);

  return (
    <div className="p-6">
      <TalentSearchHeader isRTL={isRTL()} />

      <SearchForm
        formData={formData}
        totalCost={totalCost}
        balance={balance}
        searching={searching}
        onUpdateForm={updateFormData}
        onSearch={handleSearch}
        onApplyRequirements={applyRequirements}
      />

      {showResults && (
        <>
          <SearchFilters
            filters={filters}
            uniqueLocations={uniqueLocations}
            experienceRanges={experienceRanges}
            onUpdateFilters={updateFilters}
          />

          <SearchResults
            candidates={filteredAndSortedResults}
            showResults={showResults}
          />
        </>
      )}

      <LoadingOverlay searching={searching} />
    </div>
  );
};
