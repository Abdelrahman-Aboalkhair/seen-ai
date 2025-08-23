import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Sparkles, Info } from "lucide-react";
import { TEST_TYPES, TestType, DurationOption } from "../types";
import { TestTypeCard } from "./TestTypeCard";

interface TestTypesSelectionProps {
  selectedTestTypes: TestType[];
  expandedCards: Set<string>;
  onToggleTestType: (testType: TestType, selectedPlan?: DurationOption) => void;
  onToggleExpansion: (testTypeId: string) => void;
  onUpdateData: (updates: any) => void;
  interviewData: any;
}

export const TestTypesSelection: React.FC<TestTypesSelectionProps> = ({
  selectedTestTypes,
  expandedCards,
  onToggleTestType,
  onToggleExpansion,
  onUpdateData,
  interviewData,
}) => {
  return (
    <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          أنواع الاختبارات
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>اختر نوع واحد أو أكثر من الاختبارات</span>
          </div>
          <Badge variant="outline" className="bg-white dark:bg-gray-800">
            {selectedTestTypes.length} نوع محدد
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_TYPES.map((testType) => {
            const isSelected = selectedTestTypes.some(
              (t: TestType) => t.id === testType.id
            );
            const isExpanded = expandedCards.has(testType.id);
            const canSelect = true; // Remove duration-based restrictions

            return (
              <TestTypeCard
                key={testType.id}
                testType={testType}
                isSelected={isSelected}
                isExpanded={isExpanded}
                canSelect={canSelect}
                selectedTestTypes={selectedTestTypes}
                onToggleTestType={onToggleTestType}
                onToggleExpansion={onToggleExpansion}
                onUpdateData={onUpdateData}
                interviewData={interviewData}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
