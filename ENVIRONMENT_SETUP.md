# Environment Setup Guide

This guide explains how to set up environment variables for different deployment environments.

## Overview

The application now uses a centralized configuration system that automatically switches between development and production environments based on the `NODE_ENV` variable and Vite's build mode.

## Environment Variables

### Required Variables

These variables must be set in all environments:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Variables

These variables have sensible defaults but can be customized:

- `VITE_API_BASE_URL`: Base URL for your API (defaults to localhost:3000 in dev, your domain in prod)
- `VITE_APP_URL`: Your application URL (defaults to localhost:5173 in dev, your domain in prod)
- `VITE_OPENAI_API_KEY`: OpenAI API key (if using OpenAI services)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (if using Stripe)
- `VITE_APP_NAME`: Application name (defaults to "Smart Recruiter")
- `VITE_APP_VERSION`: Application version (defaults to "1.0.0")

## Local Development Setup

1. Copy the example environment file:

   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your development values:

   ```env
   NODE_ENV=development
   VITE_SUPABASE_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-dev-anon-key
   VITE_API_BASE_URL=http://localhost:3000
   VITE_APP_URL=http://localhost:5173
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment (Vercel)

### Option 1: Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   ```
   VITE_SUPABASE_URL=https://your-production-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_APP_URL=https://yourdomain.com
   VITE_OPENAI_API_KEY=your-production-openai-key
   VITE_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
   ```

### Option 2: Using Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Add environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_API_BASE_URL
   vercel env add VITE_APP_URL
   ```

## Environment-Specific Builds

The application supports different build modes:

- **Development**: `npm run build:dev`
- **Production**: `npm run build:prod` (default for Vercel)

## Configuration Files

- `src/lib/config.ts`: Centralized configuration utility
- `src/lib/api.ts`: API client for dynamic URL handling
- `src/lib/supabase.ts`: Updated to use centralized config
- `vite.config.ts`: Enhanced with environment loading

## Validation

The configuration system automatically validates required environment variables and provides helpful error messages if they're missing.

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that your `.env.local` file exists and has the correct values
2. Ensure all required variables are set in your deployment platform
3. Restart your development server after making changes

### Production Build Issues

If production builds fail:

1. Verify all required environment variables are set in Vercel
2. Check that the build command is using the correct mode: `npm run build:prod`
3. Review the build logs for specific error messages

### API URL Issues

If API calls are failing:

1. Verify `VITE_API_BASE_URL` is set correctly for your environment
2. Check that the API endpoints are accessible from your deployment
3. Use the `apiClient.buildUrl()` utility for consistent URL construction

## Security Notes

- Never commit `.env.local` or any files containing real API keys
- Use different API keys for development and production
- Regularly rotate your API keys
- Use environment-specific Supabase projects when possible
