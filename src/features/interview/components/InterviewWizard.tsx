import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InterviewHeader } from "./InterviewHeader";
import { ProgressBar } from "./ProgressBar";
import { SetupStep } from "./SetupStep";
import { CandidatesStep } from "./CandidatesStep";
import { QuestionsStep } from "./QuestionsStep";
import { InterviewStep } from "./InterviewStep";
import { useInterviewWizard } from "../hooks/useInterviewWizard";

export const InterviewWizard: React.FC = () => {
  const {
    interviewData,
    loading,
    createInterview,
    generateQuestions,
    addQuestion,
    removeQuestion,
    addCandidate,
    removeCandidate,
    simulateInterview,
    updateInterviewData,
    goToStep,
  } = useInterviewWizard();

  const handleCreateInterview = async () => {
    const success = await createInterview();
    if (success) {
      // Step will be updated in the hook
    }
  };

  const handleGenerateQuestions = async () => {
    const success = await generateQuestions();
    if (success) {
      // Step will be updated in the hook
    }
  };

  const handleNextStep = () => {
    goToStep(interviewData.currentStep + 1);
  };

  const handleNewInterview = () => {
    goToStep(1);
  };

  const renderCurrentStep = () => {
    switch (interviewData.currentStep) {
      case 1:
        return (
          <SetupStep
            interviewData={interviewData}
            loading={loading}
            onUpdateData={updateInterviewData}
            onCreateInterview={handleCreateInterview}
          />
        );
      case 2:
        return (
          <CandidatesStep
            candidates={interviewData.candidates}
            onAddCandidate={addCandidate}
            onNext={handleNextStep}
          />
        );
      case 3:
        return (
          <QuestionsStep
            questions={interviewData.questions}
            loading={loading}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            onGenerateQuestions={handleGenerateQuestions}
            onNext={handleNextStep}
          />
        );
      case 4:
        return (
          <InterviewStep
            candidates={interviewData.candidates}
            loading={loading}
            onSimulateInterview={simulateInterview}
            onNewInterview={handleNewInterview}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <InterviewHeader />
      <ProgressBar currentStep={interviewData.currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={interviewData.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
