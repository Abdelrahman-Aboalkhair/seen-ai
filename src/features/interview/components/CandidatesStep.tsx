import React from "react";
import { Users, Search } from "lucide-react";
import { Candidate } from "../types";
import { useCandidates } from "../hooks/useCandidates";

interface CandidatesStepProps {
  candidates: Candidate[];
  onAddCandidate: (candidate: Candidate) => void;
  onNext: () => void;
}

export const CandidatesStep: React.FC<CandidatesStepProps> = ({
  candidates,
  onAddCandidate,
  onNext,
}) => {
  const {
    filteredCandidates,
    searchQuery,
    setSearchQuery,
    loading,
    convertToInterviewCandidate,
  } = useCandidates();

  const handleAddCandidate = (candidate: any) => {
    const interviewCandidate = convertToInterviewCandidate(candidate);
    onAddCandidate(interviewCandidate);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <Users className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          خطوة 2: اختيار المرشح
        </h2>
        <p className="text-gray-400">اختر المرشح الذي تريد مقابلته</p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            اختر المرشح للمقابلة
          </h3>
          <p className="text-gray-400 mb-6">
            اختر المرشح الذي تريد مقابلته من القائمة أدناه. يمكنك النقر على أي
            مرشح لعرض تفاصيله واختياره
          </p>

          <div className="mb-4">
            <h4 className="text-white font-medium mb-2">المرشحون المتاحون</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المرشحين..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-slate-900 border border-slate-600 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => handleAddCandidate(candidate)}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-medium">
                      {candidate.full_name?.charAt(0).toUpperCase() ||
                        candidate.name?.charAt(0).toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {candidate.full_name || candidate.name || "Unknown"}
                    </h4>
                    <p className="text-gray-400 text-sm">{candidate.email}</p>
                  </div>
                </div>

                {/* Candidate Details */}
                <div className="space-y-2 mb-3">
                  {candidate.match_score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        Match Score:
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          candidate.match_score >= 80
                            ? "text-green-400"
                            : candidate.match_score >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {candidate.match_score}%
                      </span>
                    </div>
                  )}

                  {candidate.experience_years && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Experience:</span>
                      <span className="text-white text-sm">
                        {candidate.experience_years} years
                      </span>
                    </div>
                  )}

                  {candidate.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Location:</span>
                      <span className="text-white text-sm">
                        {candidate.location}
                      </span>
                    </div>
                  )}

                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Skills:</span>
                      <span className="text-white text-sm">
                        {candidate.skills.slice(0, 2).join(", ")}
                        {candidate.skills.length > 2 && "..."}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-sm font-medium">
                    Available
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {loading ? "Loading candidates..." : "No candidates available"}
              </p>
              {!loading && (
                <p className="text-gray-500 text-sm mt-2">
                  Try performing a talent search first to find candidates
                </p>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onNext}
            disabled={candidates.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            التالي
          </button>
          {candidates.length === 0 && (
            <p className="text-red-400 text-sm mt-2">
              يرجى اختيار مرشح للمتابعة
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
