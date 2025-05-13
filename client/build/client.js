import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
// Get absolute path to server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, "../../mcp-server-sample/build/main.js");
// Spawn the server
const server = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "pipe"]
});
let initialized = false;
let toolsListed = false;
server.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
        try {
            const msg = JSON.parse(line);
            if (!initialized && msg.result) {
                initialized = true;
                console.log("✅ MCP Server initialized:", msg.result);
                // List tools
                const listToolsMsg = {
                    jsonrpc: "2.0",
                    id: "list-tools-1",
                    method: "tools/list",
                    params: {}
                };
                server.stdin.write(JSON.stringify(listToolsMsg) + "\n");
            }
            else if (initialized && !toolsListed && msg.id === "list-tools-1" && msg.result) {
                toolsListed = true;
                const tools = msg.result.tools;
                console.log("🔧 Tools available:");
                tools.forEach((tool) => {
                    console.log(`- ${tool.name}: ${tool.description}`);
                    console.log("  Input schema:", JSON.stringify(tool.inputSchema));
                });
                // Try to call get-alerts as a demo
                const toolCall = {
                    jsonrpc: "2.0",
                    id: "call-1",
                    method: "tools/execute",
                    params: {
                        name: "get-alerts",
                        input: { state: "CA" }
                    }
                };
                server.stdin.write(JSON.stringify(toolCall) + "\n");
            }
            else if (msg.id === "call-1") {
                if (msg.error) {
                    console.error("❌ Tool call error:", msg.error);
                }
                else {
                    console.log("🌤️ Tool call result:", msg.result);
                }
            }
        }
        catch (e) {
            console.log("📄 Raw output:", line);
        }
    });
});
server.stderr.on("data", (data) => {
    console.error("❌ STDERR:", data.toString());
});
// Send MCP initialize message
const initMessage = {
    jsonrpc: "2.0",
    id: "1",
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        clientInfo: { name: "mcp-client-sample", version: "1.0.0" },
        capabilities: {}
    }
};
server.stdin.write(JSON.stringify(initMessage) + "\n");
// Keep process alive for responses
setTimeout(() => {
    server.kill();
    process.exit(0);
}, 8000);
