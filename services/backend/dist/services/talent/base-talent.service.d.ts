import { AxiosInstance, AxiosResponse } from 'axios';
import type { ServiceConfig } from '@/types/common.types.js';
export declare abstract class BaseTalentService {
    protected client: AxiosInstance;
    protected serviceConfig: ServiceConfig;
    constructor();
    protected withRetry<T>(operation: () => Promise<AxiosResponse<T>>, operationName: string, retries?: number): Promise<T>;
    protected generateSearchId(): string;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=base-talent.service.d.ts.map