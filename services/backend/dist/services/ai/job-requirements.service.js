import { BaseAIService } from './base-ai.service.js';
import cacheService from '@/services/cache.service.js';
import { logPerformance } from '@/lib/logger.js';
export class JobRequirementsService extends BaseAIService {
    async generateJobRequirements(request) {
        const startTime = Date.now();
        try {
            const cached = await cacheService.getJobRequirements(request);
            if (cached) {
                const duration = Date.now() - startTime;
                logPerformance('job_requirements_cached', duration, { jobTitle: request.jobTitle });
                return cached;
            }
            const result = await this.withRetry(() => this.generateJobDescription(request), 'generate_job_requirements');
            await cacheService.setJobRequirements(request, result);
            const duration = Date.now() - startTime;
            logPerformance('job_requirements_generated', duration, {
                jobTitle: request.jobTitle
            });
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async generateJobDescription(request) {
        const { jobTitle, department, experience, location, companySize, industry } = request;
        const systemPrompt = `You are an expert HR professional specializing in job description creation. Create comprehensive, realistic job requirements. Return valid JSON only.`;
        const userPrompt = `
    Generate comprehensive job requirements for the following position:

    Job Title: ${jobTitle}
    Department: ${department || 'Not specified'}
    Experience Level: ${experience || 'Not specified'}
    Location: ${location || 'Not specified'}
    Company Size: ${companySize || 'Not specified'}
    Industry: ${industry || 'Not specified'}

    Please provide detailed job requirements in the following JSON format:
    {
      "title": "string",
      "description": "string",
      "requirements": {
        "technical": string[],
        "soft": string[],
        "experience": string[],
        "education": string[]
      },
      "responsibilities": string[],
      "qualifications": string[],
      "preferredQualifications": string[]
    }

    Guidelines:
    - Make requirements specific and realistic
    - Include both must-have and nice-to-have skills
    - Consider industry standards and best practices
    - Ensure requirements align with the seniority level
    - Include relevant certifications if applicable
    `;
        const content = await this.generateCompletion(systemPrompt, userPrompt, {
            temperature: 0.4,
            maxTokens: 1500,
        });
        return this.parseJsonResponse(content, 'job_requirements');
    }
    async generateMultipleJobRequirements(requests) {
        const results = await Promise.all(requests.map(request => this.generateJobRequirements(request)));
        return results;
    }
    async generateFocusedJobRequirements(request, focus) {
        const focusPrompts = {
            technical: 'Focus heavily on technical skills, programming languages, frameworks, and technical problem-solving abilities.',
            leadership: 'Emphasize leadership qualities, team management skills, strategic thinking, and people development.',
            creative: 'Highlight creative skills, design thinking, innovation, and artistic/creative problem-solving abilities.',
            sales: 'Focus on sales skills, client relationship management, negotiation, and revenue generation abilities.'
        };
        const systemPrompt = `You are an expert HR professional specializing in job description creation. ${focusPrompts[focus]} Return valid JSON only.`;
        const userPrompt = `
    Generate comprehensive job requirements for the following ${focus}-focused position:

    Job Title: ${request.jobTitle}
    Department: ${request.department || 'Not specified'}
    Experience Level: ${request.experience || 'Not specified'}
    Location: ${request.location || 'Not specified'}
    Company Size: ${request.companySize || 'Not specified'}
    Industry: ${request.industry || 'Not specified'}

    Special Focus: ${focus.toUpperCase()}

    Please provide detailed job requirements in JSON format with emphasis on ${focus} aspects.
    `;
        const content = await this.generateCompletion(systemPrompt, userPrompt, {
            temperature: 0.4,
            maxTokens: 1500,
        });
        return this.parseJsonResponse(content, 'focused_job_requirements');
    }
    async updateJobRequirements(existingRequirements, updates) {
        const systemPrompt = `You are an HR professional updating job requirements based on new information.`;
        const userPrompt = `
    Update the following job requirements based on the new information provided:

    Current Requirements:
    ${JSON.stringify(existingRequirements, null, 2)}

    Updates to Apply:
    ${JSON.stringify(updates, null, 2)}

    Please provide the updated job requirements in the same JSON format, incorporating the changes while maintaining consistency.
    `;
        const content = await this.generateCompletion(systemPrompt, userPrompt, {
            temperature: 0.3,
            maxTokens: 1500,
        });
        return this.parseJsonResponse(content, 'updated_job_requirements');
    }
}
//# sourceMappingURL=job-requirements.service.js.map