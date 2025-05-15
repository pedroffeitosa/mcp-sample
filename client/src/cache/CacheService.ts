interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate a cache key for weather data requests
  static generateKey(tool: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    return `${tool}:${JSON.stringify(sortedParams)}`;
  }
} 