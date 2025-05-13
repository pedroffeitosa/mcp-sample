export class NWSApiService {
    API_BASE = "https://api.weather.gov";
    USER_AGENT = "weather-app/1.0";
    // Helper function for making NWS API requests
    async makeRequest(endpoint) {
        const url = `${this.API_BASE}${endpoint}`;
        const headers = {
            "User-Agent": this.USER_AGENT,
            Accept: "application/geo+json",
        };
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return (await response.json());
        }
        catch (error) {
            console.error("Error making NWS request:", error);
            return null;
        }
    }
    async getAlerts(stateCode) {
        return this.makeRequest(`/alerts?area=${stateCode}`);
    }
    async getPoints(latitude, longitude) {
        return this.makeRequest(`/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`);
    }
    async getForecast(forecastUrl) {
        // This endpoint requires the full URL, not just the path
        const headers = {
            "User-Agent": this.USER_AGENT,
            Accept: "application/geo+json",
        };
        try {
            const response = await fetch(forecastUrl, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return (await response.json());
        }
        catch (error) {
            console.error("Error making NWS request:", error);
            return null;
        }
    }
}
