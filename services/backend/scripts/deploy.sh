#!/bin/bash

# Smart Recruiter Backend Deployment Script
# Usage: ./scripts/deploy.sh [environment] [platform]
# Example: ./scripts/deploy.sh production vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
PLATFORM=${2:-vercel}

echo -e "${BLUE}🚀 Smart Recruiter Backend Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Platform: ${PLATFORM}${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo -e "${YELLOW}Please copy env.example to .env and configure it${NC}"
    exit 1
fi

# Pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js 18+ required (current: $(node --version))${NC}"
    exit 1
fi

# Check if required environment variables are set
echo -e "${BLUE}📋 Checking environment variables...${NC}"

required_vars=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "JWT_SECRET"
    "REDIS_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Error: Missing required environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${RED}  - ${var}${NC}"
    done
    exit 1
fi

# Run tests if they exist
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm test
fi

# Type checking
echo -e "${BLUE}🔍 Running type check...${NC}"
npm run type-check

# Linting
echo -e "${BLUE}🔍 Running linter...${NC}"
npm run lint

# Build the application
echo -e "${BLUE}🏗️  Building application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Platform-specific deployment
case $PLATFORM in
    "vercel")
        echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
            npm install -g vercel
        fi
        
        # Deploy to Vercel
        if [ "$ENVIRONMENT" = "production" ]; then
            vercel --prod --yes
        else
            vercel --yes
        fi
        ;;
        
    "railway")
        echo -e "${BLUE}🚀 Deploying to Railway...${NC}"
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}📦 Installing Railway CLI...${NC}"
            npm install -g @railway/cli
        fi
        
        # Deploy to Railway
        railway up
        ;;
        
    "docker")
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        
        # Build Docker image
        docker build -t smart-recruiter-backend:$ENVIRONMENT .
        
        if [ "$ENVIRONMENT" = "production" ]; then
            # Tag for production
            docker tag smart-recruiter-backend:$ENVIRONMENT smart-recruiter-backend:latest
            echo -e "${GREEN}✅ Docker image built: smart-recruiter-backend:latest${NC}"
        else
            echo -e "${GREEN}✅ Docker image built: smart-recruiter-backend:$ENVIRONMENT${NC}"
        fi
        
        echo -e "${BLUE}To run the container:${NC}"
        echo "docker run -p 3000:3000 --env-file .env smart-recruiter-backend:$ENVIRONMENT"
        ;;
        
    "heroku")
        echo -e "${BLUE}🚀 Deploying to Heroku...${NC}"
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo -e "${RED}❌ Error: Heroku CLI not found${NC}"
            echo -e "${YELLOW}Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli${NC}"
            exit 1
        fi
        
        # Deploy to Heroku
        git add .
        git commit -m "Deploy to Heroku - $(date)" || true
        git push heroku main
        ;;
        
    *)
        echo -e "${RED}❌ Error: Unsupported platform: $PLATFORM${NC}"
        echo -e "${YELLOW}Supported platforms: vercel, railway, docker, heroku${NC}"
        exit 1
        ;;
esac

# Post-deployment checks
echo -e "${BLUE}🔍 Running post-deployment checks...${NC}"

# Wait a moment for deployment to be ready
sleep 10

# Health check (if URL is available)
if [ "$PLATFORM" != "docker" ]; then
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    # Try to get the deployment URL
    case $PLATFORM in
        "vercel")
            # Get URL from Vercel CLI (this is simplified)
            echo -e "${YELLOW}Please check your Vercel dashboard for the deployment URL${NC}"
            ;;
        "railway")
            # Get URL from Railway CLI
            echo -e "${YELLOW}Please check your Railway dashboard for the deployment URL${NC}"
            ;;
        "heroku")
            APP_NAME=$(heroku apps:info --json | jq -r '.app.name')
            HEALTH_URL="https://${APP_NAME}.herokuapp.com/health"
            
            if curl -f -s "$HEALTH_URL" > /dev/null; then
                echo -e "${GREEN}✅ Health check passed${NC}"
            else
                echo -e "${YELLOW}⚠️  Health check failed - please check logs${NC}"
            fi
            ;;
    esac
fi

# Final success message
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Update your frontend environment variable:${NC}"
echo -e "${BLUE}   VITE_CUSTOM_BACKEND_URL=<your-deployment-url>${NC}"
echo -e "${BLUE}2. Test the API endpoints${NC}"
echo -e "${BLUE}3. Monitor the logs for any issues${NC}"
echo ""

# Show useful commands
echo -e "${BLUE}Useful commands:${NC}"
case $PLATFORM in
    "vercel")
        echo -e "${BLUE}  View logs: vercel logs${NC}"
        echo -e "${BLUE}  View deployments: vercel ls${NC}"
        ;;
    "railway")
        echo -e "${BLUE}  View logs: railway logs${NC}"
        echo -e "${BLUE}  View deployments: railway status${NC}"
        ;;
    "docker")
        echo -e "${BLUE}  Run container: docker run -p 3000:3000 --env-file .env smart-recruiter-backend:$ENVIRONMENT${NC}"
        echo -e "${BLUE}  View logs: docker logs <container-id>${NC}"
        ;;
    "heroku")
        echo -e "${BLUE}  View logs: heroku logs --tail${NC}"
        echo -e "${BLUE}  Open app: heroku open${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
