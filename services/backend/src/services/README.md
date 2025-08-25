# Queue Services Architecture

This directory contains a clean, reusable architecture for managing job queues using BullMQ and Redis.

## Architecture Overview

### 🏗️ **Base Queue Service** (`base/base-queue.service.ts`)

- **Abstract base class** that provides all common BullMQ functionality
- **Reusable** across different types of job queues
- **DRY principle** - no code duplication
- **Type-safe** with generics for job data and results
- **Built-in features**: job creation, status tracking, statistics, cleanup, graceful shutdown

### 🎯 **Job Processors** (`queue-manager.service.ts`)

- **Strategy pattern** implementation for different job types
- **Clean separation** of concerns between queue management and job processing
- **Easy to extend** for new job types
- **Consistent interface** across all processors

### 🚀 **Queue Manager** (`queue-manager.service.ts`)

- **Singleton pattern** for centralized queue management
- **Single point of control** for all queues
- **Health monitoring** and statistics aggregation
- **Bulk operations** (cleanup, shutdown) across all queues

### 🔧 **Specific Queue Services**

- **Extend base class** with minimal code
- **Type-safe** interfaces for specific job types
- **Clean API** for each service domain

## File Structure

```
services/
├── base/
│   └── base-queue.service.ts          # Abstract base class
├── queue-manager.service.ts            # Centralized management
├── cv-analysis-queue.service.ts        # CV analysis specific
├── job-requirements-queue.service.ts   # Job requirements specific
├── interview-analysis-queue.service.ts # Interview analysis specific
├── question-generation-queue.service.ts # Question generation specific
└── README.md                          # This file
```

## Key Benefits

### ✅ **Clean Code**

- **No duplication** - common functionality in base class
- **Single responsibility** - each class has one clear purpose
- **Easy to read** and understand

### ✅ **Reusable**

- **Base class** can be extended for any job type
- **Job processors** can be swapped or extended
- **Consistent patterns** across all queues

### ✅ **Maintainable**

- **Changes in one place** affect all queues
- **Easy to add** new queue types
- **Centralized configuration** and monitoring

### ✅ **Type Safe**

- **Generic types** ensure compile-time safety
- **Interface contracts** for job data and results
- **TypeScript** provides excellent IntelliSense

## Usage Examples

### Creating a New Queue Service

```typescript
// 1. Create a job processor
class MyJobProcessor implements JobProcessor<MyJobData, MyJobResult> {
  async process(job: Job<MyJobData>): Promise<MyJobResult> {
    // Your job processing logic here
    return await this.service.processJob(job.data);
  }

  getEstimatedProcessingTime(data: MyJobData): number {
    // Estimate processing time based on data complexity
    return 5000; // 5 seconds
  }
}

// 2. Extend the base class
export class MyQueueService extends BaseQueueService<MyJobData, MyJobResult> {
  constructor() {
    super("my-queue", new MyJobProcessor());
  }

  // 3. Add any queue-specific methods
  async createMyJob(data: MyJobData): Promise<string> {
    return await this.createJob(data, "process-my-job");
  }
}
```

### Using the Queue Manager

```typescript
// Get the singleton instance
const queueManager = QueueManagerService.getInstance();

// Get a specific queue
const cvQueue = queueManager.getCVAnalysisQueue();

// Get all queue statistics
const allStats = await queueManager.getAllQueueStats();

// Get health status
const health = await queueManager.getHealthStatus();

// Clean up old jobs
await queueManager.cleanupAllQueues(24); // 24 hours

// Graceful shutdown
await queueManager.shutdownAllQueues();
```

### Health Monitoring

```typescript
// GET /api/queues/health
{
  "status": "healthy",
  "queues": {
    "cv-analysis": {
      "status": "healthy",
      "message": "Queue operating normally"
    },
    "job-requirements": {
      "status": "healthy",
      "message": "Queue operating normally"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Redis Connection

The base service automatically configures Redis with BullMQ-compatible options:

- `maxRetriesPerRequest: null` (required by BullMQ)
- `lazyConnect: true` (for better startup performance)
- Exponential backoff retry strategy
- Automatic job cleanup

## Best Practices

### 🎯 **Job Processing**

- Keep job processors **lightweight** and focused
- Use **async/await** for all operations
- **Handle errors** gracefully and re-throw for retry logic
- **Log progress** for debugging and monitoring

### 🔧 **Queue Management**

- Use the **Queue Manager** for bulk operations
- **Monitor health** regularly via the health endpoints
- **Clean up old jobs** periodically to prevent memory issues
- **Graceful shutdown** during maintenance windows

### 📊 **Monitoring**

- Use the **built-in statistics** for queue health
- Monitor **job failure rates** and processing times
- Set up **alerts** for queue issues
- Track **estimated vs actual** processing times

## Migration from Old Architecture

### Before (Duplicated Code)

```typescript
// Each service had its own Redis connection, Queue, Worker, etc.
export class CVAnalysisQueueService {
  private redis: Redis;
  private cvAnalysisQueue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  // ... 200+ lines of duplicated code
}
```

### After (Clean & Reusable)

```typescript
// Extends base class with minimal code
export class CVAnalysisQueueService extends BaseQueueService<
  CVAnalysisJobData,
  CVAnalysisResult
> {
  constructor() {
    super("cv-analysis", new CVAnalysisJobProcessor());
  }

  // Only queue-specific methods here
  async createCVAnalysisJob(request: CVAnalysisRequest): Promise<string> {
    // Implementation
  }
}
```

## Performance Considerations

- **Concurrency**: Set to 1 for OpenAI rate limiting
- **Job cleanup**: Automatic removal of completed/failed jobs
- **Redis optimization**: Lazy connections and connection pooling
- **Memory management**: Regular cleanup of old jobs
- **Error handling**: Exponential backoff for retries

## Troubleshooting

### Common Issues

1. **Redis Connection**: Check Redis host/port/password
2. **Job Failures**: Check job processor logic and error handling
3. **Memory Issues**: Ensure old jobs are being cleaned up
4. **Performance**: Monitor job processing times and queue lengths

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
DEBUG=queue:*
```

## Future Enhancements

- **Priority queues** for urgent jobs
- **Job scheduling** for delayed execution
- **Batch processing** for multiple jobs
- **Advanced monitoring** with metrics and dashboards
- **Queue scaling** with multiple workers
- **Job dependencies** and workflows
