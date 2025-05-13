# MCP Weather Example Project

This project demonstrates a Model Context Protocol (MCP) server and client for weather data, built with Node.js/TypeScript. It provides a clean, modular implementation of the MCP protocol with proper error handling and type safety.

## Features

- **MCP Server**: Provides weather tools via the MCP protocol over stdio.
  - `get-alerts`: Get active weather alerts for a US state (e.g., `CA`, `NY`).
  - `get-forecast`: Get weather forecast for a given latitude and longitude.
  - Input validation with [Zod](https://github.com/colinhacks/zod).
  - Integration with the US National Weather Service (NWS) API.
- **MCP Client**: A robust TypeScript client that:
  - Manages server lifecycle
  - Provides type-safe tool execution
  - Handles errors gracefully
  - Supports async/await operations
  - Configurable through a clean interface

## Project Structure

```
.
├── server/                 # MCP Server implementation
│   ├── src/
│   │   ├── domain/        # Domain models and interfaces
│   │   ├── infrastructure/# External API services (NWS)
│   │   ├── application/   # Business logic and data formatting
│   │   ├── interface/     # MCP tool controllers and validation
│   │   └── main.ts        # Server entry point
│   └── build/             # Compiled JavaScript
│
├── client/                # MCP Client implementation
│   ├── src/
│   │   └── client.ts      # Main client implementation
│   └── build/             # Compiled JavaScript
│
├── LICENSE               # GNU GPL v3.0
├── CONTRIBUTING.md       # Contribution guidelines
└── CHANGELOG.md         # Project changelog
```

## Installation

Clone the repository and install dependencies for both server and client:

```bash
git clone <REPOSITORY_URL>
cd server
npm install
npm run build

cd ../client
npm install
npm run build
```

## Usage

### Running the Server

After building, you can run the server directly:

```bash
cd server
npm start
```

### Using the Client

The client can be used in two ways:

1. **As a standalone application**:
```bash
cd client
npm start
```

2. **As a library in your own project**:
```typescript
import { MCPClient } from './src/client';

const client = new MCPClient({
  // Optional configuration
  timeout: 30000,
  clientInfo: {
    name: 'my-app',
    version: '1.0.0'
  }
});

try {
  // Execute a tool
  const result = await client.executeTool('get-alerts', { state: 'CA' });
  console.log('Weather alerts:', result);
} catch (error) {
  console.error('Error:', error);
} finally {
  client.cleanup();
}
```

### Client Configuration

The `MCPClient` constructor accepts an optional configuration object:

```typescript
interface ClientConfig {
  serverPath?: string;    // Path to the server executable
  timeout?: number;       // Timeout in milliseconds (default: 30000)
  clientInfo?: {         // Client information
    name: string;
    version: string;
  };
}
```

## Development

### Server Development

```bash
cd server
npm run build    # Build the server
npm start        # Run the server
```

### Client Development

```bash
cd client
npm run dev     # Run in development mode with ts-node
npm run build   # Build the client
npm start       # Run the built client
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and improvements.

## Credits

- Uses [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- Input validation with [Zod](https://github.com/colinhacks/zod)
- Weather data from the US National Weather Service (NWS) API 