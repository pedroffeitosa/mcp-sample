import { MCPClient } from '../../src/client';
import { mockWeatherAlerts, mockWeatherForecast } from '../mocks/weatherData';

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient({
      timeout: 5000,
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    });
  });

  afterEach(() => {
    client.cleanup();
  });

  describe('executeTool', () => {
    it('should execute get-alerts tool successfully', async () => {
      const result = await client.executeTool('get-alerts', { state: 'CA' });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('features');
    });

    it('should execute get-forecast tool successfully', async () => {
      const result = await client.executeTool('get-forecast', {
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('properties.periods');
    });

    it('should handle invalid tool name', async () => {
      await expect(
        client.executeTool('invalid-tool' as any, {})
      ).rejects.toThrow();
    });

    it('should handle invalid parameters', async () => {
      await expect(
        client.executeTool('get-alerts', { invalid: 'param' } as any)
      ).rejects.toThrow();
    });
  });

  describe('caching', () => {
    let cachedClient: MCPClient;

    beforeEach(() => {
      cachedClient = new MCPClient({
        cacheConfig: {
          enabled: true,
          ttl: 1000 // 1 second for testing
        }
      });
    });

    afterEach(() => {
      cachedClient.cleanup();
    });

    it('should cache successful tool execution results', async () => {
      // First call should hit the server
      const result1 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result1.success).toBe(true);

      // Second call with same parameters should use cache
      const result2 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);

      // Different parameters should still hit the server
      const result3 = await cachedClient.executeTool('get-alerts', { state: 'NY' });
      expect(result3.success).toBe(true);
      expect(result3.data).not.toEqual(result1.data);
    });

    it('should not cache failed tool executions', async () => {
      // First call with invalid state
      const result1 = await cachedClient.executeTool('get-alerts', { state: 'INVALID' });
      expect(result1.success).toBe(false);

      // Second call should still hit the server
      const result2 = await cachedClient.executeTool('get-alerts', { state: 'INVALID' });
      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();
    });

    it('should respect cache TTL', async () => {
      // First call
      const result1 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result1.success).toBe(true);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call should hit the server again
      const result2 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result2.success).toBe(true);
      // Note: In a real test, we might want to mock the server to verify it was called
    });

    it('should generate consistent cache keys regardless of parameter order', async () => {
      // First call
      const result1 = await cachedClient.executeTool('get-forecast', {
        latitude: 37.7749,
        longitude: -122.4194
      });
      expect(result1.success).toBe(true);

      // Second call with same parameters in different order
      const result2 = await cachedClient.executeTool('get-forecast', {
        longitude: -122.4194,
        latitude: 37.7749
      });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);
    });

    it('should clear cache on cleanup', async () => {
      // First call
      const result1 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result1.success).toBe(true);

      // Cleanup
      cachedClient.cleanup();

      // Create new client
      cachedClient = new MCPClient({
        cacheConfig: {
          enabled: true,
          ttl: 1000
        }
      });

      // Second call should hit the server
      const result2 = await cachedClient.executeTool('get-alerts', { state: 'CA' });
      expect(result2.success).toBe(true);
      // Note: In a real test, we might want to mock the server to verify it was called
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await client.executeTool('get-alerts', { state: 'CA' });
      client.cleanup();
      await expect(
        client.executeTool('get-alerts', { state: 'CA' })
      ).rejects.toThrow();
    });
  });
}); 