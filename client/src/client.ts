import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Type definitions for MCP messages
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: { code: number; message: string };
}

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface ClientConfig {
  serverPath?: string;
  timeout?: number;
  clientInfo?: {
    name: string;
    version: string;
  };
}

class MCPClient {
  private server: ChildProcess;
  private initialized = false;
  private toolsListed = false;
  private tools: Tool[] = [];
  private messageHandlers: Map<string, (response: MCPResponse) => void> = new Map();

  constructor(config: ClientConfig = {}) {
    const {
      serverPath = this.getDefaultServerPath(),
      timeout = 30000,
      clientInfo = { name: "mcp-client-sample", version: "1.0.0" }
    } = config;

    this.server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.setupServerListeners();
    this.initialize(clientInfo);

    // Set timeout for cleanup
    setTimeout(() => {
      this.cleanup();
    }, timeout);
  }

  private getDefaultServerPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "../../server/build/main.js");
  }

  private setupServerListeners(): void {
    this.server.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line: string) => {
        try {
          const msg: MCPResponse = JSON.parse(line);
          this.handleMessage(msg);
        } catch (e) {
          console.log("📄 Raw output:", line);
        }
      });
    });

    this.server.stdout?.on("data", (data) => {
      console.error("❌ STDERR:", data.toString());
    });

    this.server.stderr?.on("data", (data) => {
      console.error("❌ Server error:", error);
      this.cleanup();
    });
  }

  private handleMessage(msg: MCPResponse): void {
    const msgId = msg.id?.toString() || "";
    const handler = this.messageHandlers.get(msgId);
    if (handler) {
      handler(msg);
      this.messageHandlers.delete(msgId);
    }

    if (!this.initialized && msg.result) {
      this.initialized = true;
      console.log("✅ MCP Server initialized:", msg.result);
      this.listTools();
    }
  }

  private initialize(clientInfo: { name: string; version: string }): void {
    const initMessage: MCPRequest = {
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        clientInfo,
        capabilities: {}
      }
    };
    this.sendMessage(initMessage);
  }

  private listTools(): void {
    const listToolsMsg: MCPRequest = {
      jsonrpc: "2.0",
      id: "list-tools",
      method: "tools/list",
      params: {}
    };

    this.messageHandlers.set("list-tools", (response: MCPResponse) => {
      if (response.result?.tools) {
        this.tools = response.result.tools;
        this.toolsListed = true;
        console.log("🔧 Tools available:");
        this.tools.forEach((tool) => {
          console.log(`- ${tool.name}: ${tool.description}`);
          console.log("  Input schema:", JSON.stringify(tool.inputSchema));
        });
      }
    });

    this.sendMessage(listToolsMsg);
  }

  public async executeTool(name: string, input: Record<string, unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
      const toolCall: MCPRequest = {
        jsonrpc: "2.0",
        id: `call-${Date.now()}`,
        method: "tools/execute",
        params: { name, input }
      };

      this.messageHandlers.set(toolCall.id.toString(), (response: MCPResponse) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.sendMessage(toolCall);
    });
  }

  private sendMessage(message: MCPRequest): void {
    if (this.server.stdin) {
      this.server.stdin.write(JSON.stringify(message) + "\n");
    }
  }

  public cleanup(): void {
    if (this.server) {
      this.server.kill();
    }
  }
}

// Example usage
async function main() {
  const client = new MCPClient();
  
  try {
    // Wait for initialization and tools listing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example tool call
    const result = await client.executeTool("get-alerts", { state: "CA" });
    console.log("🌤️ Tool call result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.cleanup();
  }
}

if (require.main === module) {
  main();
}

export { MCPClient, Tool, MCPRequest, MCPResponse }; 