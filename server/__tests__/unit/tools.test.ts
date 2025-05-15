import { mockNWSResponse, mockErrorResponse } from '../mocks/weatherData';
import { getAlertsTool, getForecastTool } from '../../src/interface/tools';

describe('Weather Tools', () => {
  describe('getAlertsTool', () => {
    it('should return weather alerts for valid state', async () => {
      const result = await getAlertsTool({ state: 'CA' });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('features');
      expect(Array.isArray(result.data.features)).toBe(true);
    });

    it('should handle invalid state code', async () => {
      const result = await getAlertsTool({ state: 'XX' });
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_STATE');
    });

    it('should handle missing state parameter', async () => {
      const result = await getAlertsTool({} as any);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_PARAMETER');
    });
  });

  describe('getForecastTool', () => {
    it('should return forecast for valid coordinates', async () => {
      const result = await getForecastTool({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('properties.periods');
      expect(Array.isArray(result.data.properties.periods)).toBe(true);
    });

    it('should handle invalid coordinates', async () => {
      const result = await getForecastTool({
        latitude: 200, // Invalid latitude
        longitude: -122.4194,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_COORDINATES');
    });

    it('should handle missing coordinates', async () => {
      const result = await getForecastTool({} as any);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_PARAMETER');
    });
  });
}); 