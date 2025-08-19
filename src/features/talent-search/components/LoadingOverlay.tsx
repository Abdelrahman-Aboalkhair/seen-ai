import React from "react";
import { Search, Zap } from "lucide-react";

interface LoadingOverlayProps {
  searching: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  searching,
}) => {
  if (!searching) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Search className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">
            Searching for Candidates
          </h3>
          <p className="text-gray-400 mb-6">
            Our AI is analyzing your requirements and finding the best
            matches...
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Analyzing job requirements</span>
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Matching candidates</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Calculating match scores</span>
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
