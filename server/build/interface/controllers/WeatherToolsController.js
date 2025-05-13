import { z } from "zod";
export class WeatherToolsController {
    server;
    weatherService;
    constructor(server, weatherService) {
        this.server = server;
        this.weatherService = weatherService;
        this.registerTools();
    }
    registerTools() {
        this.registerGetAlertsToolhandler();
        this.registerGetForecastToolHandler();
    }
    registerGetAlertsToolhandler() {
        this.server.tool("get-alerts", "Get weather alerts for a state", {
            state: z
                .string()
                .length(2)
                .describe("Two-letter state code (e.g. CA, NY)"),
        }, async ({ state }) => {
            const alertsText = await this.weatherService.getAlertsForState(state);
            return {
                content: [
                    {
                        type: "text",
                        text: alertsText,
                    },
                ],
            };
        });
    }
    registerGetForecastToolHandler() {
        this.server.tool("get-forecast", "Get weather forecast for a location", {
            latitude: z
                .number()
                .min(-90)
                .max(90)
                .describe("Latitude of the location"),
            longitude: z
                .number()
                .min(-180)
                .max(180)
                .describe("Longitude of the location"),
        }, async ({ latitude, longitude }) => {
            const forecastText = await this.weatherService.getForecastForLocation(latitude, longitude);
            return {
                content: [
                    {
                        type: "text",
                        text: forecastText,
                    },
                ],
            };
        });
    }
}
