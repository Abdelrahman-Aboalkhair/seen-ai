import React, { useState } from "react";
import { Zap, Brain, AlertCircle, Search } from "lucide-react";
import {
  TalentSearchForm,
  MATCH_SCORE_TYPES,
  EDUCATION_LEVELS,
  CANDIDATE_COUNT_OPTIONS,
} from "../types";
import { JobRequirementsGenerator } from "../../../components/ui/JobRequirementsGenerator";

interface SearchFormProps {
  formData: TalentSearchForm;
  totalCost: number;
  balance: number;
  searching: boolean;
  onUpdateForm: (updates: Partial<TalentSearchForm>) => void;
  onSearch: () => void;
  onApplyRequirements: (requirements: any) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  formData,
  totalCost,
  balance,
  searching,
  onUpdateForm,
  onSearch,
  onApplyRequirements,
}) => {
  const [showRequirementsGenerator, setShowRequirementsGenerator] =
    useState(false);

  const handleRequirementsGenerated = (requirements: any) => {
    onApplyRequirements(requirements);
    setShowRequirementsGenerator(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => onUpdateForm({ jobTitle: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Job Description
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => onUpdateForm({ jobDescription: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Required Skills *
            </label>
            <input
              type="text"
              value={formData.skillsRequired}
              onChange={(e) => onUpdateForm({ skillsRequired: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Certifications
            </label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) => onUpdateForm({ certifications: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., AWS Certified, Google Cloud"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Education Level
            </label>
            <select
              value={formData.educationLevel}
              onChange={(e) => onUpdateForm({ educationLevel: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Education Level</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Languages
            </label>
            <input
              type="text"
              value={formData.languages}
              onChange={(e) => onUpdateForm({ languages: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., English, Arabic, French"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Number of Candidates
            </label>
            <select
              value={formData.numberOfCandidates}
              onChange={(e) =>
                onUpdateForm({ numberOfCandidates: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CANDIDATE_COUNT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Match Score Type
            </label>
            <select
              value={formData.matchScoreType}
              onChange={(e) => onUpdateForm({ matchScoreType: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(MATCH_SCORE_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} (
                  {value.percentage}%) - {value.total} credits
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cost and Balance Info */}
      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-white font-medium">Total Cost:</span>
              <span className="text-yellow-400 font-bold ml-2">
                {totalCost} credits
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400">Balance:</span>
              <span className="text-green-400 font-bold ml-2">
                {balance} credits
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowRequirementsGenerator(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate Requirements
          </button>
        </div>
        {balance < totalCost && (
          <div className="mt-3 flex items-center text-red-400">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Insufficient credits. Please add more credits to continue.
            </span>
          </div>
        )}
      </div>

      {/* Search Button */}
      <div className="mt-6 text-center">
        <button
          onClick={onSearch}
          disabled={searching || balance < totalCost}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center mx-auto"
        >
          <Search className="h-5 w-5 mr-2" />
          {searching ? "Searching..." : "Search Candidates"}
        </button>
      </div>

      {/* Job Requirements Generator Modal */}
      {showRequirementsGenerator && (
        <JobRequirementsGenerator
          onRequirementsGenerated={handleRequirementsGenerated}
        />
      )}
    </div>
  );
};
