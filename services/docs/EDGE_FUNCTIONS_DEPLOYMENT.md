# Edge Functions Deployment Guide

This guide explains how to deploy edge functions with proper environment variable configuration and no hardcoded URLs.

## 🎯 Overview

The edge functions have been updated to use a centralized configuration system that:

- ✅ Removes all hardcoded URLs
- ✅ Uses environment variables for all external services
- ✅ Provides consistent error handling
- ✅ Supports environment-specific configurations

## 📁 New Shared Utilities

### 1. **Configuration Utility** (`supabase/functions/_shared/config.ts`)

- Centralized environment variable handling
- Validation of required variables
- Environment detection (development/production)
- Type-safe configuration interface

### 2. **API Client Utilities** (`supabase/functions/_shared/api-client.ts`)

- `OpenAIClient` - For OpenAI API calls
- `StripeClient` - For Stripe API calls
- `N8NClient` - For N8N webhook calls
- `SupabaseClient` - For Supabase operations

## 🔧 Environment Variables Setup

### Required Variables (All Functions)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Function-Specific Variables

```bash
# CV Analysis & Job Requirements Generator
OPENAI_API=your-openai-api-key

# Process Payment
STRIPE_SECRET_KEY=your-stripe-secret-key

# Talent Search
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint
```

### Optional Variables

```bash
# Environment Detection
ENVIRONMENT=production

# Override Default API URLs (optional)
OPENAI_BASE_URL=https://api.openai.com/v1
STRIPE_BASE_URL=https://api.stripe.com/v1
```

## 🚀 Deployment Steps

### 1. **Set Environment Variables in Supabase**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Edge Functions**
3. Add each environment variable:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Function-specific
OPENAI_API=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint

# Optional
ENVIRONMENT=production
```

### 2. **Deploy Edge Functions**

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific functions
supabase functions deploy cv-analysis
supabase functions deploy talent-search
supabase functions deploy process-payment
supabase functions deploy job-requirements-generator
```

### 3. **Verify Deployment**

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs cv-analysis
```

## 🧪 Local Development

### 1. **Setup Local Environment**

```bash
# Navigate to functions directory
cd supabase/functions

# Create local environment file
cp env.example .env

# Edit .env with your development values
```

### 2. **Test Functions Locally**

```bash
# Start local development server
supabase functions serve

# Test specific function
curl -X POST http://localhost:54321/functions/v1/cv-analysis \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📋 Function-Specific Configuration

### CV Analysis Function

**Environment Variables:**

- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `OPENAI_API` (required)

**Changes Made:**

- ✅ Removed hardcoded OpenAI URLs
- ✅ Uses `OpenAIClient` for API calls
- ✅ Centralized error handling

### Talent Search Function

**Environment Variables:**

- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `N8N_WEBHOOK_URL` (required)

**Changes Made:**

- ✅ Already uses environment variable for N8N URL
- ✅ Uses `N8NClient` for webhook calls
- ✅ Centralized error handling

### Process Payment Function

**Environment Variables:**

- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `STRIPE_SECRET_KEY` (required)

**Changes Made:**

- ✅ Removed hardcoded Stripe URL
- ✅ Uses `StripeClient` for API calls
- ✅ Centralized error handling

### Job Requirements Generator Function

**Environment Variables:**

- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `OPENAI_API` (required)

**Changes Made:**

- ✅ Removed hardcoded OpenAI URL
- ✅ Uses `OpenAIClient` for API calls
- ✅ Centralized error handling

## 🔍 Testing and Validation

### 1. **Environment Variable Validation**

Each function now validates required environment variables on startup:

```typescript
// Functions will throw clear errors if variables are missing
if (!config.external.openai.apiKey) {
  throw new Error("OpenAI API key not configured");
}
```

### 2. **API Call Testing**

Test external API connections:

```bash
# Test OpenAI API
curl -X POST http://localhost:54321/functions/v1/cv-analysis \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"test": true, "cvText": "test", "jobTitle": "test", "jobDescription": "test", "skillsRequired": ["test"]}'

# Test Stripe API
curl -X POST http://localhost:54321/functions/v1/process-payment \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"packageId": "test-package-id"}'
```

### 3. **Error Handling Verification**

Functions now provide consistent error responses:

```json
{
  "error": {
    "message": "OpenAI API key not configured",
    "code": "Error"
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Missing Environment Variables**

   ```
   Error: Missing required environment variable: SUPABASE_URL
   ```

   **Solution:** Add the missing variable in Supabase dashboard

2. **Invalid API Keys**

   ```
   Error: OpenAI API error (401): Invalid API key
   ```

   **Solution:** Check and update your API keys

3. **Function Not Found**
   ```
   Error: Function not found
   ```
   **Solution:** Deploy the function using `supabase functions deploy`

### Debug Mode

Enable debug logging by setting:

```bash
ENVIRONMENT=development
```

This will log configuration details and API call information.

## 🔒 Security Best Practices

1. **Use Different Keys for Environments**

   - Development: Use test API keys
   - Production: Use production API keys

2. **Regular Key Rotation**

   - Rotate API keys every 90 days
   - Monitor API usage for unusual activity

3. **Environment Isolation**

   - Use separate Supabase projects for dev/staging/prod
   - Never share production keys

4. **Access Control**
   - Use service role keys only in edge functions
   - Never expose service role keys to client-side code

## 📈 Monitoring

### 1. **Function Logs**

```bash
# View real-time logs
supabase functions logs --follow

# View specific function logs
supabase functions logs cv-analysis
```

### 2. **Error Tracking**

- Monitor function error rates
- Set up alerts for failed API calls
- Track response times

### 3. **Usage Analytics**

- Monitor API call volumes
- Track credit usage
- Monitor payment processing

## 🎉 Benefits Achieved

- ✅ **No Hardcoded URLs** - All external service URLs are configurable
- ✅ **Environment Agnostic** - Works in development and production
- ✅ **Centralized Configuration** - Single source of truth for all settings
- ✅ **Better Error Handling** - Consistent error messages and logging
- ✅ **Type Safety** - TypeScript interfaces prevent configuration errors
- ✅ **Easy Maintenance** - Update configurations without code changes
- ✅ **Security** - No secrets in source code

---

**Next Steps:** Deploy your edge functions with the new configuration and test all functionality.
