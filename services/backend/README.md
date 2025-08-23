# 🚀 Smart Recruiter Backend

Custom Node.js backend for AI-heavy operations and external API integrations.

## Features

- 🤖 **AI Operations**: CV analysis, question generation, interview analysis
- 💳 **Payment Processing**: Stripe integration with webhooks
- 🔍 **Talent Search**: N8N workflow integration
- 🚄 **High Performance**: Redis caching, connection pooling
- 🔐 **Security**: JWT authentication, rate limiting, input validation
- 📊 **Monitoring**: Comprehensive logging, health checks
- 🐳 **Docker Ready**: Full containerization support

## Quick Start

### Prerequisites

- Node.js 20+
- Redis
- PostgreSQL (via Supabase)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Start Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Run in development
npm run dev
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
OPENAI_API_KEY=your-openai-api-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
STRIPE_SECRET_KEY=your-stripe-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-key
ALLOWED_ORIGINS=http://localhost:5173

# Performance
CACHE_TTL_CV_ANALYSIS=3600
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### AI Operations

| Method | Endpoint | Description | Credits |
|--------|----------|-------------|---------|
| POST | `/api/ai/cv-analysis` | Analyze CV against job requirements | 2 |
| POST | `/api/ai/batch-cv-analysis` | Batch CV analysis (max 5) | 2 per CV |
| POST | `/api/ai/generate-questions` | Generate interview questions | 1 |
| POST | `/api/ai/analyze-interview` | Analyze interview results | 3 |
| POST | `/api/ai/generate-job-requirements` | Generate job requirements | 1 |
| GET | `/api/ai/stats` | Get AI usage statistics | 0 |
| GET | `/api/ai/health` | AI service health check | 0 |

### Payment Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/process` | Process payment |
| POST | `/api/payment/refund` | Process refund |
| POST | `/api/payment/setup-intent` | Create setup intent |
| GET | `/api/payment/payment-methods` | List payment methods |
| GET | `/api/payment/status/:id` | Get payment status |
| POST | `/api/payment/subscription` | Create subscription |
| POST | `/api/payment/subscription/:id/cancel` | Cancel subscription |
| POST | `/api/payment/webhook` | Stripe webhook handler |
| GET | `/api/payment/history` | Payment history |
| GET | `/api/payment/health` | Payment service health |

### Talent Search Operations

| Method | Endpoint | Description | Credits |
|--------|----------|-------------|---------|
| POST | `/api/talent/search` | Basic talent search | 2 |
| POST | `/api/talent/search/advanced` | Advanced talent search | 3 |
| POST | `/api/talent/search/batch` | Batch talent search (max 5) | 2 per search |
| GET | `/api/talent/profile/:id` | Get talent profile | 1 |
| POST | `/api/talent/outreach/:id` | Send outreach message | 1 |
| POST | `/api/talent/workflow/trigger` | Trigger custom workflow | 2 |
| GET | `/api/talent/workflow/status/:id` | Get workflow status | 0 |
| POST | `/api/talent/workflow/cancel/:id` | Cancel workflow | 0 |
| GET | `/api/talent/analytics` | Search analytics | 0 |
| GET | `/api/talent/health` | Talent service health | 0 |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Overall system health |
| GET | `/api/rate-limit-status` | Rate limit status |
| GET | `/api` | API information |

## Request/Response Examples

### CV Analysis

**Request:**
```json
POST /api/ai/cv-analysis
{
  "cvText": "John Doe\nSoftware Engineer with 5 years experience...",
  "jobRequirements": "We are looking for a Senior React Developer..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "matchPercentage": 78,
    "strengths": ["React expertise", "5 years experience"],
    "weaknesses": ["No TypeScript mentioned"],
    "recommendations": ["Consider TypeScript training"],
    "keySkills": ["React", "JavaScript", "Node.js"],
    "experience": {
      "years": 5,
      "relevantExperience": ["Frontend development", "React projects"]
    },
    "summary": "Strong candidate with relevant React experience..."
  },
  "creditsRemaining": 48,
  "processingTime": 2500
}
```

### Payment Processing

**Request:**
```json
POST /api/payment/process
{
  "amount": 1000,
  "currency": "usd",
  "credits": 10,
  "description": "10 credits purchase",
  "paymentMethodId": "pm_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_1234567890",
    "status": "succeeded",
    "amount": 1000,
    "currency": "usd",
    "credits": 10
  },
  "processingTime": 1200
}
```

### Talent Search

**Request:**
```json
POST /api/talent/search
{
  "jobTitle": "React Developer",
  "skills": ["React", "TypeScript", "Node.js"],
  "location": "New York",
  "experience": "3-5 years",
  "remote": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "profile_123",
        "name": "Jane Smith",
        "jobTitle": "Senior React Developer",
        "skills": ["React", "TypeScript", "GraphQL"],
        "experience": 4,
        "location": "New York",
        "remote": true,
        "matchScore": 92,
        "availability": "available"
      }
    ],
    "totalCount": 1,
    "searchId": "search_456",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "creditsRemaining": 46,
  "processingTime": 3200
}
```

## Architecture

### Services

- **OpenAI Service**: Handles all AI operations with caching
- **N8N Service**: Manages workflow integrations and talent search
- **Stripe Service**: Processes payments and handles webhooks
- **Cache Service**: Redis-based caching with TTL management

### Middleware

- **Authentication**: JWT token validation with Supabase
- **Rate Limiting**: User-based and endpoint-specific limits
- **Validation**: Request validation with Zod schemas
- **Logging**: Comprehensive request/response logging

### Utilities

- **Redis Client**: Connection pooling and error handling
- **Supabase Client**: Database operations and user management
- **Logger**: Structured logging with rotation

## Development

### Scripts

```bash
npm run dev          # Development with hot reload
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

### Testing

```bash
# Health check
curl http://localhost:3000/health

# Rate limit status
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/rate-limit-status

# AI service health
curl http://localhost:3000/api/ai/health
```

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

### Railway

```bash
railway login
railway link
railway up
```

### Docker

```bash
# Build image
docker build -t smart-recruiter-backend .

# Run container
docker run -p 3000:3000 --env-file .env smart-recruiter-backend
```

## Monitoring

### Health Checks

The service provides comprehensive health checks:

- Redis connectivity
- Supabase database access
- External API availability
- Cache service functionality

### Logging

Logs are structured and include:

- Request/response details
- Performance metrics
- Error context
- User activity
- External API calls

### Metrics

Key metrics tracked:

- Response times
- Error rates
- Cache hit/miss ratios
- Rate limit usage
- Credit consumption

## Security

### Authentication

- JWT token validation
- Supabase user verification
- Session management with Redis

### Rate Limiting

- Per-user limits
- Per-endpoint limits
- Burst handling
- IP-based fallback

### Input Validation

- Zod schema validation
- Request size limits
- Content type validation
- Sanitization

## Performance

### Caching Strategy

- CV analysis: 1 hour TTL
- Questions: 2 hours TTL
- Interview analysis: 30 minutes TTL
- Job requirements: 4 hours TTL

### Connection Pooling

- HTTP keep-alive for external APIs
- Redis connection pooling
- Request batching

### Optimization

- Compression middleware
- Response caching
- Database query optimization
- Concurrent request handling

## Error Handling

### Error Types

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Rate limit errors (429)
- Internal errors (500)
- Service unavailable (503)

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "message": "Detailed message"
}
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details
