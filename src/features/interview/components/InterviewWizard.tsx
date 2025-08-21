import React, { useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Progress } from "../../../components/ui/Progress";
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { useInterviewWizard } from "../hooks/useInterviewWizard";
import toast from "react-hot-toast";
import { InterviewSetup } from "./InterviewSetup";
import { CandidateSelection } from "./CandidateSelection";
import { InterviewSummary } from "./InterviewSummary";
import { SummaryStep } from "./SummaryStep";
import { INTERVIEW_STEPS } from "../types";

export const InterviewWizard: React.FC = () => {
  const {
    interviewData,
    questions,
    candidates,
    loading,
    generatingQuestions,
    balance,
    updateInterviewData,
    toggleTestType,
    generateQuestions,
    updateQuestions,
    regenerateQuestions,
    fetchCandidates,
    createInterview,
    addCandidatesToInterview,
    generateInterviewLinks,
    resetInterview,
  } = useInterviewWizard();

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    []
  );
  const [interviewCandidates, setInterviewCandidates] = useState<any[]>([]);

  const currentStep = interviewData.currentStep;
  const totalSteps = INTERVIEW_STEPS.length;

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Step 1: Generate questions and create interview
      if (questions.length === 0) {
        await generateQuestions();
      }
      if (questions.length > 0) {
        // Only create interview if it hasn't been created yet
        if (!interviewData.id) {
          await createInterview();
        }
        updateInterviewData({ currentStep: currentStep + 1 });
      }
    } else if (currentStep === 2) {
      // Step 2: Add candidates to interview
      if (selectedCandidateIds.length > 0) {
        const addedCandidates = await addCandidatesToInterview(
          selectedCandidateIds
        );
        setInterviewCandidates(addedCandidates || []);
        updateInterviewData({ currentStep: currentStep + 1 });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      updateInterviewData({ currentStep: currentStep - 1 });
    }
  };

  const handleCandidateToggle = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCandidateIds(candidates.map((c) => c.candidateId!));
  };

  const handleDeselectAll = () => {
    setSelectedCandidateIds([]);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        // Allow proceeding if questions are generated, even if interview ID is not set yet
        // The interview will be created when the user clicks Next
        return questions.length > 0;
      case 2:
        return selectedCandidateIds.length > 0;
      case 3:
        // Step 3 is the final step, no next button needed
        return false;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <InterviewSetup
            interviewData={interviewData}
            questions={questions}
            onUpdateData={updateInterviewData}
            onGenerateQuestions={generateQuestions}
            onUpdateQuestions={updateQuestions}
            onContinueToNextStep={handleNextStep}
            generatingQuestions={generatingQuestions}
            balance={balance}
            onToggleTestType={toggleTestType}
            onRegenerateQuestions={regenerateQuestions}
          />
        );

      case 2:
        return (
          <CandidateSelection
            candidates={candidates}
            selectedCandidates={selectedCandidateIds}
            onCandidateToggle={handleCandidateToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onAddCandidates={handleNextStep}
            loading={loading}
            onFetchCandidates={fetchCandidates}
          />
        );

      case 3:
        return (
          <SummaryStep
            interviewData={{
              ...interviewData,
              questions: questions,
              candidates: interviewCandidates,
            }}
            onComplete={() => {
              // Handle completion - could redirect to dashboard or show success message
              toast.success("تم إنشاء المقابلة بنجاح!");
            }}
            onReset={resetInterview}
            onGenerateLinks={generateInterviewLinks}
          />
        );

      default:
        return null;
    }
  };

  const getStepIcon = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (stepNumber === currentStep) {
      return <Circle className="h-5 w-5 text-primary" />;
    } else {
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return "completed";
    } else if (stepNumber === currentStep) {
      return "current";
    } else {
      return "upcoming";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">إنشاء مقابلة جديدة</h1>
        <p className="text-muted-foreground">
          اتبع الخطوات التالية لإنشاء مقابلة مخصصة وإرسالها للمرشحين
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {INTERVIEW_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {getStepIcon(step.id)}
                    <div
                      className={`text-sm font-medium ${
                        getStepStatus(step.id) === "completed"
                          ? "text-green-600"
                          : getStepStatus(step.id) === "current"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                  {index < INTERVIEW_STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            <Badge variant="outline">
              الخطوة {currentStep} من {totalSteps}
            </Badge>
          </div>

          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">{renderStepContent()}</div>

      {/* Navigation */}
      {currentStep < 3 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                السابق
              </Button>

              <div className="flex items-center gap-4">
                {currentStep === 1 && questions.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    تم إنشاء {questions.length} سؤال
                  </div>
                )}

                {currentStep === 2 && selectedCandidateIds.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedCandidateIds.length} مرشح محدد
                  </div>
                )}

                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep() || loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      التالي
                      <ChevronRight className="h-4 w-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INTERVIEW_STEPS.map((step) => (
          <Card
            key={step.id}
            className={`${
              getStepStatus(step.id) === "completed"
                ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                : getStepStatus(step.id) === "current"
                ? "border-primary bg-primary/5"
                : "border-muted"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                {getStepIcon(step.id)}
                <h3 className="font-semibold">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>

              {getStepStatus(step.id) === "completed" && (
                <Badge variant="secondary" className="mt-2">
                  مكتمل
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
