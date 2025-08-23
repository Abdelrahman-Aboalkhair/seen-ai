import { CVAnalysisService } from "./cv-analysis.service.js";
import { QuestionGenerationService } from "./question-generation.service.js";
import { InterviewAnalysisService } from "./interview-analysis.service.js";
import { JobRequirementsService } from "./job-requirements.service.js";
import logger from "@/lib/logger.js";

// Main AI Service that orchestrates all AI operations
export class AIService {
  private cvAnalysisService: CVAnalysisService;
  private questionGenerationService: QuestionGenerationService;
  private interviewAnalysisService: InterviewAnalysisService;
  private jobRequirementsService: JobRequirementsService;

  constructor() {
    this.cvAnalysisService = new CVAnalysisService();
    this.questionGenerationService = new QuestionGenerationService();
    this.interviewAnalysisService = new InterviewAnalysisService();
    this.jobRequirementsService = new JobRequirementsService();

    logger.info("AI Service initialized with all sub-services");
  }

  // CV Analysis operations
  get cvAnalysis() {
    return {
      analyze: this.cvAnalysisService.analyzeCV.bind(this.cvAnalysisService),
      batchAnalyze: this.cvAnalysisService.batchAnalyzeCVs.bind(
        this.cvAnalysisService
      ),
    };
  }

  // Question Generation operations
  get questions() {
    return {
      generate: this.questionGenerationService.generateQuestions.bind(
        this.questionGenerationService
      ),
      generateByDifficulty:
        this.questionGenerationService.generateQuestionsByDifficulty.bind(
          this.questionGenerationService
        ),
      generateByType:
        this.questionGenerationService.generateQuestionsByType.bind(
          this.questionGenerationService
        ),
    };
  }

  // Interview Analysis operations
  get interviews() {
    return {
      analyze: this.interviewAnalysisService.analyzeInterviewResults.bind(
        this.interviewAnalysisService
      ),
      analyzeQuestion:
        this.interviewAnalysisService.analyzeQuestionPerformance.bind(
          this.interviewAnalysisService
        ),
      generateSummary:
        this.interviewAnalysisService.generateInterviewSummary.bind(
          this.interviewAnalysisService
        ),
    };
  }

  // Job Requirements operations
  get jobRequirements() {
    return {
      generate: this.jobRequirementsService.generateJobRequirements.bind(
        this.jobRequirementsService
      ),
      generateMultiple:
        this.jobRequirementsService.generateMultipleJobRequirements.bind(
          this.jobRequirementsService
        ),
      generateFocused:
        this.jobRequirementsService.generateFocusedJobRequirements.bind(
          this.jobRequirementsService
        ),
      update: this.jobRequirementsService.updateJobRequirements.bind(
        this.jobRequirementsService
      ),
    };
  }

  // Health check for all AI services
  async healthCheck(): Promise<{
    overall: boolean;
    services: {
      cvAnalysis: boolean;
      questionGeneration: boolean;
      interviewAnalysis: boolean;
      jobRequirements: boolean;
    };
  }> {
    try {
      const [cv, questions, interviews, jobReqs] = await Promise.all([
        this.cvAnalysisService.healthCheck(),
        this.questionGenerationService.healthCheck(),
        this.interviewAnalysisService.healthCheck(),
        this.jobRequirementsService.healthCheck(),
      ]);

      const services = {
        cvAnalysis: cv,
        questionGeneration: questions,
        interviewAnalysis: interviews,
        jobRequirements: jobReqs,
      };

      const overall = Object.values(services).every((status) => status);

      return { overall, services };
    } catch (error) {
      logger.error("AI Service health check failed", {
        error: (error as Error).message,
      });
      return {
        overall: false,
        services: {
          cvAnalysis: false,
          questionGeneration: false,
          interviewAnalysis: false,
          jobRequirements: false,
        },
      };
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<{
    uptime: number;
    services: string[];
    healthStatus: any;
  }> {
    const healthStatus = await this.healthCheck();

    return {
      uptime: process.uptime(),
      services: [
        "cvAnalysis",
        "questionGeneration",
        "interviewAnalysis",
        "jobRequirements",
      ],
      healthStatus,
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
