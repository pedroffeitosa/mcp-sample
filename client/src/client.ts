import path from "path";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from 'child_process';
import { CacheService } from './cache/CacheService.js';

// Type definitions for MCP messages
interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ClientConfig {
  serverPath?: string;
  timeout?: number;
  clientInfo?: {
    name: string;
    version: string;
  };
  cacheConfig?: {
    enabled: boolean;
    ttl?: number;
  };
}

class MCPClient {
  private server: ChildProcess;
  private initialized = false;
  private toolsListed = false;
  private tools: Tool[] = [];
  private messageHandlers: Map<string, (response: MCPResponse) => void> = new Map();
  private serverPath: string;
  private timeout: number;
  private clientInfo: { name: string; version: string };
  private cacheService?: CacheService;

  constructor(config: ClientConfig = {}) {
    this.serverPath = config.serverPath ?? this.getDefaultServerPath();
    this.timeout = config.timeout ?? 30000;
    this.clientInfo = config.clientInfo ?? { name: "mcp-client-sample", version: "1.0.0" };

    if (config.cacheConfig?.enabled) {
      this.cacheService = new CacheService(config.cacheConfig.ttl);
    }

    this.server = spawn("node", [this.serverPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.setupServerListeners();
    this.initialize(this.clientInfo);

    // Set timeout for cleanup
    setTimeout(() => {
      this.cleanup();
    }, this.timeout);
  }

  private getDefaultServerPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "../../server/build/main.js");
  }

  private setupServerListeners(): void {
    if (!this.server.stdout || !this.server.stderr) {
      throw new Error('Server process streams not initialized');
    }

    this.server.stdout.on('data', (data: Buffer) => {
      try {
        const response: MCPResponse = JSON.parse(data.toString());
        const handler = this.messageHandlers.get(response.id.toString());
        if (handler) {
          handler(response);
          this.messageHandlers.delete(response.id.toString());
        }
      } catch (err) {
        console.error('Error parsing server response:', err);
      }
    });

    this.server.stderr.on('data', (data: Buffer) => {
      console.error('Server error:', data.toString());
    });

    this.server.on('error', (err: Error) => {
      console.error('Server process error:', err);
    });

    this.server.on('exit', (code: number | null) => {
      console.log('Server process exited with code:', code);
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
          console.log("  Input schema:", JSON.stringify(tool.parameters));
        });
      }
    });

    this.sendMessage(listToolsMsg);
  }

  async executeTool<T = any>(tool: string, params: Record<string, any>): Promise<{
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: string };
  }> {
    // Check cache first if enabled
    if (this.cacheService) {
      const cacheKey = CacheService.generateKey(tool, params);
      const cachedData = this.cacheService.get<{
        success: boolean;
        data?: T;
        error?: { code: string; message: string; details?: string };
      }>(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Execute tool and cache result if successful
    const result = await this._executeToolInternal<T>(tool, params);
    
    if (this.cacheService && result.success) {
      const cacheKey = CacheService.generateKey(tool, params);
      this.cacheService.set(cacheKey, result);
    }

    return result;
  }

  private async _executeToolInternal<T>(tool: string, params: Record<string, any>): Promise<{
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: string };
  }> {
    return new Promise((resolve, reject) => {
      const toolCall: MCPRequest = {
        jsonrpc: "2.0",
        id: `call-${Date.now()}`,
        method: "tools/execute",
        params: { name: tool, input: params }
      };

      this.messageHandlers.set(toolCall.id.toString(), (response: MCPResponse) => {
        if (response.error) {
          resolve({
            success: false,
            error: {
              code: response.error.code.toString(),
              message: response.error.message,
              details: response.error.data?.toString()
            }
          });
        } else {
          resolve({
            success: true,
            data: response.result as T
          });
        }
      });

      this.server.stdin?.write(JSON.stringify(toolCall) + "\n");
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
    if (this.cacheService) {
      this.cacheService.clear();
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

export { MCPClient }; 