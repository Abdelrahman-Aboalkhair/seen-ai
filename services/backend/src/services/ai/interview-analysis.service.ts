import { BaseAIService } from './base-ai.service.js';
import cacheService from '@/services/cache.service.js';
import logger, { logPerformance } from '@/lib/logger.js';
import type { InterviewAnalysisRequest, InterviewAnalysisResult } from '@/types/ai.types.js';

export class InterviewAnalysisService extends BaseAIService {
  
  // Analyze interview results with caching
  async analyzeInterviewResults(request: InterviewAnalysisRequest): Promise<InterviewAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await cacheService.getInterviewAnalysis(request.sessionId);

      if (cached) {
        const duration = Date.now() - startTime;
        logPerformance('interview_analysis_cached', duration, { sessionId: request.sessionId });
        return cached;
      }

      // Generate analysis using OpenAI
      const result = await this.withRetry(
        () => this.generateInterviewAnalysis(request),
        'analyze_interview'
      );

      // Cache the result
      await cacheService.setInterviewAnalysis(request.sessionId, result);

      const duration = Date.now() - startTime;
      logPerformance('interview_analysis_generated', duration, { 
        sessionId: request.sessionId 
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Generate interview analysis using OpenAI
  private async generateInterviewAnalysis(request: InterviewAnalysisRequest): Promise<InterviewAnalysisResult> {
    const { questions, answers } = request;

    const systemPrompt = `You are an expert interview assessor. Provide fair, constructive feedback with specific examples. Return valid JSON only.`;

    const userPrompt = `
    Analyze the following interview session and provide comprehensive feedback.

    Questions and Answers:
    ${questions.map((q, i) => {
      const answer = answers.find(a => a.questionId === q.id);
      return `
      Question ${i + 1} (${q.type}, ${q.difficulty}): ${q.question}
      Answer: ${answer?.answer || 'No answer provided'}
      Duration: ${answer?.duration || 0}ms
      Expected: ${q.expectedAnswer || 'Not specified'}
      `;
    }).join('\n')}

    Please provide analysis in the following JSON format:
    {
      "overallScore": number (0-100),
      "questionScores": [
        {
          "questionId": "string",
          "score": number (0-100),
          "feedback": "string",
          "strengths": string[],
          "improvements": string[]
        }
      ],
      "summary": "string",
      "recommendations": string[],
      "strengths": string[],
      "weaknesses": string[]
    }

    Evaluate based on:
    1. Answer completeness and accuracy
    2. Technical knowledge demonstrated
    3. Communication skills
    4. Problem-solving approach
    5. Cultural fit indicators
    6. Response time appropriateness
    `;

    const content = await this.generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    return this.parseJsonResponse<InterviewAnalysisResult>(content, 'interview_analysis');
  }

  // Analyze specific question performance
  async analyzeQuestionPerformance(
    questionId: string,
    question: string,
    answer: string,
    expectedAnswer?: string
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    const systemPrompt = `You are an expert interview assessor. Analyze individual question responses objectively.`;

    const userPrompt = `
    Analyze this specific interview question and answer:

    Question: ${question}
    Answer: ${answer}
    Expected Answer: ${expectedAnswer || 'Not specified'}

    Provide analysis in JSON format:
    {
      "score": number (0-100),
      "feedback": "detailed feedback string",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
    `;

    const content = await this.generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 500,
    });

    return this.parseJsonResponse(content, 'question_analysis');
  }

  // Generate interview summary
  async generateInterviewSummary(
    candidateName: string,
    position: string,
    overallScore: number,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
  ): Promise<string> {
    const systemPrompt = `You are an HR professional creating interview summaries for hiring decisions.`;

    const userPrompt = `
    Create a professional interview summary for:
    
    Candidate: ${candidateName}
    Position: ${position}
    Overall Score: ${overallScore}/100
    
    Strengths: ${strengths.join(', ')}
    Areas for Improvement: ${weaknesses.join(', ')}
    Recommendations: ${recommendations.join(', ')}
    
    Write a concise, professional summary (2-3 paragraphs) that would help hiring managers make informed decisions.
    `;

    return await this.generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.4,
      maxTokens: 400,
    });
  }
}
