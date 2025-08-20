import React, { useState } from "react";
import { JobInformationCard } from "./JobInformationCard";
import { TestTypesSelection } from "./TestTypesSelection";
import { InterviewSummary } from "./InterviewSummary";
import { TestType, DurationOption } from "../types";

interface InterviewSetupProps {
  interviewData: any;
  questions: any[];
  onUpdateData: (updates: any) => void;
  onGenerateQuestions: () => void;
  onUpdateQuestions: (questions: any[]) => void;
  onContinueToNextStep: () => void;
  generatingQuestions: boolean;
  balance: number;
  onToggleTestType?: (
    testType: TestType,
    selectedPlan?: DurationOption
  ) => void;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  interviewData,
  questions,
  onUpdateData,
  onGenerateQuestions,
  onUpdateQuestions,
  onContinueToNextStep,
  generatingQuestions,
  balance,
  onToggleTestType,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleTestTypeToggle = (
    testType: TestType,
    selectedPlan?: DurationOption
  ) => {
    if (onToggleTestType) {
      // Use the parent's toggle function if available
      onToggleTestType(testType, selectedPlan);
    } else {
      // Fallback to local implementation
      const currentSelectedTypes = interviewData.selectedTestTypes || [];
      const isSelected = currentSelectedTypes.some(
        (t: TestType) => t.id === testType.id
      );

      if (isSelected) {
        if (selectedPlan) {
          // Update the plan for existing test type
          const newSelectedTypes = currentSelectedTypes.map((t: TestType) =>
            t.id === testType.id ? { ...t, selectedPlan } : t
          );
          onUpdateData({ selectedTestTypes: newSelectedTypes });
        } else {
          // Remove test type
          const newSelectedTypes = currentSelectedTypes.filter(
            (t: TestType) => t.id !== testType.id
          );
          onUpdateData({ selectedTestTypes: newSelectedTypes });
        }
      } else {
        // Add new test type with selected plan
        if (!selectedPlan) {
          // If no plan selected, use the first available plan
          selectedPlan = testType.durationOptions[0];
        }

        const testTypeWithPlan = { ...testType, selectedPlan };
        const newSelectedTypes = [...currentSelectedTypes, testTypeWithPlan];
        onUpdateData({ selectedTestTypes: newSelectedTypes });
      }
    }
  };

  const toggleCardExpansion = (testTypeId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(testTypeId)) {
      newExpanded.delete(testTypeId);
    } else {
      newExpanded.add(testTypeId);
    }
    setExpandedCards(newExpanded);
  };

  const canGenerateQuestions = () => {
    return (
      interviewData.jobTitle?.trim() !== "" &&
      (interviewData.selectedTestTypes?.length || 0) > 0 &&
      balance >= interviewData.creditsUsed
    );
  };

  const selectedTestTypes = interviewData.selectedTestTypes || [];

  return (
    <div className="space-y-8">
      {/* Job Information Card */}
      <JobInformationCard
        interviewData={interviewData}
        onUpdateData={onUpdateData}
      />

      {/* Test Types Selection */}
      <TestTypesSelection
        selectedTestTypes={selectedTestTypes}
        expandedCards={expandedCards}
        onToggleTestType={handleTestTypeToggle}
        onToggleExpansion={toggleCardExpansion}
        onUpdateData={onUpdateData}
        interviewData={interviewData}
      />

      {/* Interview Summary */}
      <InterviewSummary
        interviewData={interviewData}
        questions={questions}
        canGenerateQuestions={canGenerateQuestions()}
        onGenerateQuestions={onGenerateQuestions}
        generatingQuestions={generatingQuestions}
        balance={balance}
        onContinueToNextStep={onContinueToNextStep}
      />
    </div>
  );
};
