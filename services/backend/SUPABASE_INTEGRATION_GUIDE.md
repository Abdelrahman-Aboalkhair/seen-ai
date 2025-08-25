# Supabase Integration Guide for CV Analysis

## Overview

This guide explains how to set up Supabase integration for storing CV analysis results in your existing database schema.

## Prerequisites

- Supabase project already set up
- Existing `cv_analyses` table in your schema
- Backend environment configured

## Database Schema

Your existing `cv_analyses` table structure is already compatible:

```sql
CREATE TABLE public.cv_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text NOT NULL,
  job_description text NOT NULL,
  required_skills ARRAY,
  file_count integer DEFAULT 0,
  results jsonb,
  credits_cost integer DEFAULT 5,
  status text DEFAULT 'processing'::text CHECK (status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cv_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT cv_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Cloudinary Configuration (if using file uploads)
CLOUD_NAME=your_cloud_name_here
CLOUD_API_KEY=your_api_key_here
CLOUD_API_SECRET=your_api_secret_here
```

## Database Migration

Run the migration to add indexes and RLS policies:

```bash
# Apply the migration in your Supabase SQL editor
# File: supabase/migrations/001_update_cv_analyses_table.sql
```

## Features Implemented

### Backend

- ✅ **Supabase Configuration**: Connection setup with service role key
- ✅ **Database Service**: CRUD operations for CV analyses
- ✅ **Repository Integration**: Automatic saving of analysis results
- ✅ **History Controller**: API endpoints for history management
- ✅ **History Routes**: RESTful endpoints for history operations

### Frontend

- ✅ **API Service**: Methods for history operations
- ✅ **React Query Hook**: `useCVAnalysisHistory` for data fetching
- ✅ **History Integration**: Ready to use with existing history page

## API Endpoints

### CV Analysis History

- `GET /api/ai/cv-analysis/history` - Get user's analysis history
- `GET /api/ai/cv-analysis/history/:id` - Get specific analysis
- `DELETE /api/ai/cv-analysis/history/:id` - Delete analysis
- `GET /api/ai/cv-analysis/history/stats` - Get user statistics

### Query Parameters

- `userId` (required): User ID to fetch history for
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status ('completed', 'failed', 'processing')

## Usage Examples

### Backend - Save Analysis Result

```typescript
// Automatically called when CV analysis completes
await dbService.saveAnalysisResult(
  userId,
  jobTitle,
  jobDescription,
  requiredSkills,
  fileCount,
  analysisResult,
  creditsCost
);
```

### Frontend - Fetch History

```typescript
import { useCVAnalysisHistory } from "../hooks/useCVAnalysisHistory";

const { useAnalysisHistory, useAnalysisStats } = useCVAnalysisHistory();

// Get user's analysis history
const { data: history, isLoading } = useAnalysisHistory(userId, 20, 0);

// Get user's statistics
const { data: stats } = useAnalysisStats(userId);
```

## Data Flow

1. **CV Analysis Request** → User uploads CV or provides text
2. **AI Processing** → OpenAI analyzes the CV
3. **Database Save** → Results automatically saved to `cv_analyses` table
4. **History Display** → Frontend fetches and displays saved analyses

## Security

- Row Level Security (RLS) enabled
- Users can only access their own analyses
- Service role key used for backend operations
- Proper error handling and logging

## Monitoring

- Comprehensive logging for all database operations
- Error tracking and fallback mechanisms
- Performance monitoring for database queries

## Next Steps

1. Test the integration with a sample CV analysis
2. Verify data is being saved correctly
3. Check that the history page displays saved analyses
4. Monitor performance and adjust as needed

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure all Supabase variables are set
2. **RLS Policies**: Check that RLS policies are properly configured
3. **Foreign Key Constraints**: Verify user_id references exist in auth.users
4. **JSONB Data**: Ensure analysis results are valid JSON

### Debug Commands

```bash
# Check Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/cv_analyses?select=count" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Test backend health
curl -X GET "http://localhost:3000/health"
```

## Support

For issues or questions, check the logs and ensure all environment variables are properly configured.
