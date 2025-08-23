import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Brain } from "lucide-react";
import { TEST_LEVELS } from "../types";

interface JobInformationCardProps {
  interviewData: any;
  onUpdateData: (updates: any) => void;
}

export const JobInformationCard: React.FC<JobInformationCardProps> = ({
  interviewData,
  onUpdateData,
}) => {
  return (
    <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          معلومات الوظيفة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            عنوان الوظيفة *
          </label>
          <Input
            value={interviewData.jobTitle || ""}
            onChange={(e) => onUpdateData({ jobTitle: e.target.value })}
            placeholder="مطور واجهات أمامية"
            className="h-12 text-lg"
          />
          <p className="text-sm text-gray-500 mt-1">مطلوب للمتابعة</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            وصف الوظيفة
          </label>
          <Textarea
            value={interviewData.jobDescription || ""}
            onChange={(e) => onUpdateData({ jobDescription: e.target.value })}
            placeholder="... وصف مفصل للوظيفة والمتطلبات"
            rows={4}
            className="text-base"
          />
          <p className="text-sm text-gray-500 mt-1">
            اختياري - يساعد في إنشاء أسئلة أفضل
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            مستوى الاختبار
          </label>
          <select
            value={interviewData.testLevel || "intermediate"}
            onChange={(e) => onUpdateData({ testLevel: e.target.value })}
            className="w-full h-12 px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            {TEST_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
};
