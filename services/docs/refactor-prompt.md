# 🔄 **Hybrid Architecture Migration Prompt**

## **Context & Current State**

I have a Smart Recruiter application currently built with:

- **Frontend**: React + TypeScript + Vite
- **Backend**: 30+ Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **External Services**: OpenAI API, N8N workflows, Stripe payments

**Current Edge Functions:**

- `cv-analysis` - Heavy AI processing with OpenAI
- `generate-questions` / `generate-interview-questions` - AI question generation
- `analyze-interview-results` - AI interview analysis
- `talent-search` - N8N workflow integration
- `job-requirements-generator` - AI job requirements
- `process-payment` - Stripe payment processing
- `add-credits` / `deduct-credits` / `check-credit-balance` - Credit management
- `admin-*` functions - Admin operations
- `fetch-candidates` - Database queries
- `create-interview` / `get-interviews` - Interview management

**Performance Issues:**

- Cold start delays (200-500ms)
- No connection pooling for external APIs
- No caching for repeated operations
- Limited concurrent request handling
- Hardcoded URLs in edge functions

## **Goal: Implement Hybrid Architecture**

### **Keep in Supabase Edge Functions:**

- Authentication and user management
- Credit system operations (`add-credits`, `deduct-credits`, `check-credit-balance`)
- Admin operations (`admin-get-users`, `admin-grant-credits`, etc.)
- Simple database CRUD operations
- User profile management

### **Move to Custom Node.js Backend:**

- **AI-heavy operations**: CV analysis, question generation, interview analysis
- **External API integrations**: OpenAI, N8N, Stripe
- **Batch processing**: Multiple CV analysis, bulk operations
- **Caching layer**: Redis for repeated operations
- **Performance optimizations**: Connection pooling, rate limiting

## **Detailed Implementation Requirements**

### **1. Create Custom Node.js Backend**

**Structure:**

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts          # Environment configuration
│   ├── services/
│   │   ├── openai.service.ts # OpenAI API integration
│   │   ├── n8n.service.ts    # N8N workflow integration
│   │   ├── stripe.service.ts # Stripe payment processing
│   │   └── cache.service.ts  # Redis caching layer
│   ├── routes/
│   │   ├── ai.routes.ts      # AI endpoints
│   │   ├── payment.routes.ts # Payment endpoints
│   │   └── talent.routes.ts  # Talent search endpoints
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validation.ts     # Request validation
│   ├── lib/
│   │   ├── redis.ts          # Redis client
│   │   ├── supabase.ts       # Supabase client
│   │   └── logger.ts         # Logging utility
│   └── app.ts                # Express app setup
├── package.json
├── Dockerfile
└── docker-compose.yml
```

**Key Features:**

- **Express.js** with TypeScript
- **Redis** for caching (response caching, session storage)
- **Connection pooling** for external APIs
- **Rate limiting** per user/endpoint
- **JWT authentication** (validate Supabase tokens)
- **Request validation** with Joi/Zod
- **Comprehensive logging** and error handling
- **Health check endpoints**
- **Docker containerization**

### **2. AI Service Implementation**

**OpenAI Service Requirements:**

```typescript
class OpenAIService {
  // CV Analysis with caching
  async analyzeCV(cvText: string, jobRequirements: string, userId: string);

  // Question generation with template caching
  async generateQuestions(jobTitle: string, skills: string[], count: number);

  // Interview analysis with result caching
  async analyzeInterviewResults(sessionData: any);

  // Job requirements generation
  async generateJobRequirements(jobInfo: any);

  // Batch processing for multiple CVs
  async batchAnalyzeCVs(cvFiles: any[], jobRequirements: string);
}
```

**Caching Strategy:**

- **CV Analysis**: Cache by CV content hash + job requirements (1 hour)
- **Questions**: Cache by job title + skills + count (2 hours)
- **Interview Analysis**: Cache by session ID (30 minutes)
- **Job Requirements**: Cache by job info hash (4 hours)

### **3. External API Integrations**

**N8N Service:**

```typescript
class N8NService {
  // Talent search with retry logic
  async searchTalent(searchCriteria: any);

  // Batch talent searches
  async batchTalentSearch(searches: any[]);

  // Webhook management
  async triggerWorkflow(workflowId: string, data: any);
}
```

**Stripe Service:**

```typescript
class StripeService {
  // Payment processing with error handling
  async processPayment(paymentData: any);

  // Webhook handling
  async handleWebhook(event: any);

  // Refund processing
  async processRefund(paymentId: string, amount: number);
}
```

### **4. Frontend API Client Updates**

**Hybrid API Client:**

```typescript
class HybridApiClient {
  // Edge Functions endpoints (keep existing)
  edgeFunctions: {
    addCredits: string;
    deductCredits: string;
    checkCreditBalance: string;
    adminGetUsers: string;
    // ... other admin functions
  };

  // Custom Backend endpoints (new)
  customBackend: {
    cvAnalysis: string;
    generateQuestions: string;
    analyzeInterview: string;
    talentSearch: string;
    processPayment: string;
  };

  // Methods for each endpoint type
  async analyzeCV(data: any); // Uses custom backend
  async deductCredits(data: any); // Uses edge functions
}
```

### **5. Environment Configuration**

**Frontend Environment Variables:**

```bash
# Existing
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# New for hybrid approach
VITE_CUSTOM_BACKEND_URL=https://your-backend.vercel.app
```

**Custom Backend Environment Variables:**

```bash
# Server
NODE_ENV=production
PORT=3000

# Supabase (for database access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
OPENAI_API_KEY=your-openai-api-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
STRIPE_SECRET_KEY=your-stripe-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Optional overrides
OPENAI_BASE_URL=https://api.openai.com/v1
STRIPE_BASE_URL=https://api.stripe.com/v1
```

### **6. Migration Strategy**

**Phase 1: Setup Custom Backend**

1. Create Node.js backend structure
2. Implement core services (OpenAI, caching)
3. Set up authentication middleware
4. Deploy to hosting platform (Vercel/Railway)

**Phase 2: Update Frontend**

1. Create hybrid API client
2. Update environment configuration
3. Modify existing services to use hybrid endpoints
4. Test both edge functions and custom backend

**Phase 3: Migrate Functions**

1. Move `cv-analysis` to custom backend
2. Move `generate-questions` to custom backend
3. Move `analyze-interview-results` to custom backend
4. Move `talent-search` to custom backend
5. Move `process-payment` to custom backend

**Phase 4: Optimize & Monitor**

1. Implement caching strategies
2. Add performance monitoring
3. Set up error tracking
4. Optimize based on usage patterns

### **7. Performance Optimizations**

**Caching Implementation:**

- **Redis** for response caching
- **In-memory** caching for frequently accessed data
- **Cache invalidation** strategies
- **Cache warming** for common operations

**Connection Pooling:**

- **HTTP keep-alive** for external APIs
- **Connection pooling** for database
- **Request batching** for multiple operations

**Rate Limiting:**

- **Per-user** rate limits
- **Per-endpoint** rate limits
- **Burst handling** for peak loads

### **8. Error Handling & Monitoring**

**Error Handling:**

- **Graceful degradation** when external APIs fail
- **Retry logic** with exponential backoff
- **Circuit breaker** pattern for external services
- **Comprehensive error logging**

**Monitoring:**

- **Response time** tracking
- **Error rate** monitoring
- **Cache hit/miss** ratios
- **External API** health checks

### **9. Security Considerations**

**Authentication:**

- **JWT validation** for Supabase tokens
- **Rate limiting** to prevent abuse
- **Input validation** for all endpoints
- **CORS** configuration

**Data Protection:**

- **Encryption** for sensitive data
- **Secure headers** implementation
- **API key** rotation strategies

### **10. Deployment & Infrastructure**

**Deployment Options:**

- **Vercel** (recommended for simplicity)
- **Railway** (good for full-stack)
- **Docker** + cloud provider
- **AWS/GCP** for enterprise

**Infrastructure Requirements:**

- **Redis** instance for caching
- **Environment variable** management
- **SSL/TLS** certificates
- **CDN** for global distribution

## **Expected Outcomes**

### **Performance Improvements:**

- **60-70% faster** CV analysis
- **75-80% faster** question generation
- **3-5x capacity** for concurrent requests
- **Reduced cold start** times
- **Better caching** for repeated operations

### **Maintainability:**

- **Centralized** AI service management
- **Better error handling** and monitoring
- **Easier debugging** and logging
- **Scalable architecture** for future growth

### **Cost Optimization:**

- **Reduced API calls** through caching
- **Better resource utilization**
- **Optimized external service usage**

## **Success Criteria**

1. **All AI operations** moved to custom backend
2. **Caching implemented** for repeated operations
3. **Performance improved** by 50%+ for AI operations
4. **Error handling** robust and comprehensive
5. **Monitoring** in place for both systems
6. **Zero downtime** during migration
7. **Backward compatibility** maintained

---

**Use this prompt when you need to implement the hybrid architecture migration. The AI should understand the current state, goals, and provide step-by-step implementation guidance for each phase.**
