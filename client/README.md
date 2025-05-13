# MCP Client Sample

This is a TypeScript client for the Model Context Protocol (MCP) server. It demonstrates how to connect to an MCP server, list available tools, and call them.

## Features

- Connects to the MCP server via stdio.
- Lists available tools and their input schemas.
- Attempts to call a tool (e.g., `get-alerts`) as a demo.

## Installation

Clone the repository and install dependencies:

```bash
git clone <REPOSITORY_URL>
cd mcp-client-sample
npm install
```

## Usage

Build and run the client:

```bash
npm run build
npm start
```

## Development

- The client is written in TypeScript. See `tsconfig.json` for configuration.
- To rebuild after changes, run `npm run build`.
- The client runs directly with Node.js (see `build/client.js`).

## License

This project is licensed under the GNU General Public License v3.0. See `../mcp-server-sample/LICENSE` for details.

## Credits

- Inspired by [Código Fonte TV](https://youtu.be/NUOzYPSNaNk)
- Uses [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

---

Pull requests and issues are welcome! 