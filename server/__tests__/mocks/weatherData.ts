export const mockNWSResponse = {
  alerts: {
    features: [
      {
        properties: {
          id: 'mock-alert-1',
          event: 'Severe Thunderstorm Warning',
          severity: 'Severe',
          areaDesc: 'Mock County, CA',
          headline: 'Severe Thunderstorm Warning issued for Mock County',
          description: 'Mock severe thunderstorm warning description',
          instruction: 'Mock instructions for severe thunderstorm',
          effective: '2024-03-20T15:00:00-07:00',
          expires: '2024-03-20T16:00:00-07:00',
        },
      },
    ],
  },
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: 'Today',
          temperature: 75,
          temperatureUnit: 'F',
          windSpeed: '10 mph',
          windDirection: 'NW',
          shortForecast: 'Sunny',
          detailedForecast: 'Mock detailed forecast for today',
          startTime: '2024-03-20T06:00:00-07:00',
          endTime: '2024-03-20T18:00:00-07:00',
        },
        {
          number: 2,
          name: 'Tonight',
          temperature: 55,
          temperatureUnit: 'F',
          windSpeed: '5 mph',
          windDirection: 'W',
          shortForecast: 'Clear',
          detailedForecast: 'Mock detailed forecast for tonight',
          startTime: '2024-03-20T18:00:00-07:00',
          endTime: '2024-03-21T06:00:00-07:00',
        },
      ],
    },
  },
};

export const mockMCPToolResponse = {
  'get-alerts': {
    success: true,
    data: mockNWSResponse.alerts,
  },
  'get-forecast': {
    success: true,
    data: mockNWSResponse.forecast,
  },
};

export const mockErrorResponse = {
  success: false,
  error: {
    code: 'MOCK_ERROR',
    message: 'Mock error message',
    details: 'Mock error details',
  },
}; 