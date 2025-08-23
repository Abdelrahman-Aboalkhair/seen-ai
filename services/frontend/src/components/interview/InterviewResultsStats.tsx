import React from "react";
import { Card, CardContent } from "../ui/Card";
import { Users, CheckCircle, Brain } from "lucide-react";

interface InterviewResultsStatsProps {
  sessionsCount: number;
  completedCount: number;
  analysesCount: number;
}

export const InterviewResultsStats: React.FC<InterviewResultsStatsProps> = ({
  sessionsCount,
  completedCount,
  analysesCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">المرشحين</p>
              <p className="text-2xl font-bold text-white mt-1">
                {sessionsCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">المكتمل</p>
              <p className="text-2xl font-bold text-white mt-1">
                {completedCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">التحليل</p>
              <p className="text-2xl font-bold text-white mt-1">
                {analysesCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
