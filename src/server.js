const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class MCPServer {
  constructor(port = 3000) {
    this.port = port;
    this.wss = new WebSocket.Server({ port });
    this.clients = new Map();
    
    console.log(`🚀 MCP Server starting on port ${port}`);
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);
      
      console.log(`📡 New MCP client connected: ${clientId}`);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          this.sendError(clientId, 'Invalid JSON message');
        }
      });

      ws.on('close', () => {
        console.log(`🔌 MCP client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send initial handshake
      this.sendMessage(clientId, {
        jsonrpc: '2.0',
        id: null,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}
          },
          clientInfo: {
            name: 'MyFirstMCP',
            version: '1.0.0'
          }
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });
  }

  handleMessage(clientId, message) {
    console.log(`📨 Received message from ${clientId}:`, message);

    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      return this.sendError(clientId, 'Invalid JSON-RPC version');
    }

    const { id, method, params } = message;

    switch (method) {
      case 'initialize':
        this.handleInitialize(clientId, id, params);
        break;
      case 'tools/list':
        this.handleToolsList(clientId, id);
        break;
      case 'tools/call':
        this.handleToolsCall(clientId, id, params);
        break;
      case 'resources/list':
        this.handleResourcesList(clientId, id);
        break;
      case 'resources/read':
        this.handleResourcesRead(clientId, id, params);
        break;
      case 'notifications/list':
        this.handleNotificationsList(clientId, id);
        break;
      case 'notifications/subscribe':
        this.handleNotificationsSubscribe(clientId, id, params);
        break;
      default:
        this.sendError(clientId, `Unknown method: ${method}`, id);
    }
  }

  handleInitialize(clientId, id, params) {
    console.log(`🔧 Initializing client ${clientId}`);
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          notifications: {}
        },
        serverInfo: {
          name: 'MyFirstMCP',
          version: '1.0.0'
        }
      }
    });
  }

  handleToolsList(clientId, id) {
    console.log(`🛠️ Listing tools for client ${clientId}`);
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'echo',
            description: 'Echo back the input text',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to echo back'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'get_time',
            description: 'Get current server time',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'calculate',
            description: 'Perform basic arithmetic calculation',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['add', 'subtract', 'multiply', 'divide'],
                  description: 'Arithmetic operation'
                },
                a: {
                  type: 'number',
                  description: 'First number'
                },
                b: {
                  type: 'number',
                  description: 'Second number'
                }
              },
              required: ['operation', 'a', 'b']
            }
          }
        ]
      }
    });
  }

  handleToolsCall(clientId, id, params) {
    const { name, arguments: args } = params;
    console.log(`🔧 Calling tool ${name} for client ${clientId}`);

    try {
      let result;
      
      switch (name) {
        case 'echo':
          result = { text: args.text };
          break;
          
        case 'get_time':
          result = { 
            timestamp: new Date().toISOString(),
            timezone: 'UTC'
          };
          break;
          
        case 'calculate':
          const { operation, a, b } = args;
          let calculationResult;
          
          switch (operation) {
            case 'add':
              calculationResult = a + b;
              break;
            case 'subtract':
              calculationResult = a - b;
              break;
            case 'multiply':
              calculationResult = a * b;
              break;
            case 'divide':
              if (b === 0) {
                throw new Error('Division by zero');
              }
              calculationResult = a / b;
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          
          result = {
            operation,
            a,
            b,
            result: calculationResult
          };
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      this.sendMessage(clientId, {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
      
    } catch (error) {
      this.sendError(clientId, error.message, id);
    }
  }

  handleResourcesList(clientId, id) {
    console.log(`📚 Listing resources for client ${clientId}`);
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        resources: [
          {
            uri: 'file:///example.txt',
            name: 'Example Text File',
            description: 'A simple example text file',
            mimeType: 'text/plain'
          }
        ]
      }
    });
  }

  handleResourcesRead(clientId, id, params) {
    const { uri } = params;
    console.log(`📖 Reading resource ${uri} for client ${clientId}`);
    
    // Mock resource content
    const mockContent = `This is a mock resource content for ${uri}
Generated at: ${new Date().toISOString()}
This demonstrates the MCP resource reading capability.`;
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: mockContent
          }
        ]
      }
    });
  }

  handleNotificationsList(clientId, id) {
    console.log(`🔔 Listing notifications for client ${clientId}`);
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        notifications: [
          {
            method: 'server/status',
            description: 'Server status updates'
          }
        ]
      }
    });
  }

  handleNotificationsSubscribe(clientId, id, params) {
    const { subscriptions } = params;
    console.log(`🔔 Subscribing to notifications for client ${clientId}:`, subscriptions);
    
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      result: {
        subscriptions: subscriptions.map(sub => ({
          method: sub,
          status: 'subscribed'
        }))
      }
    });
  }

  sendMessage(clientId, message) {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(clientId, message, id = null) {
    this.sendMessage(clientId, {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: message
      }
    });
  }

  broadcast(message) {
    this.clients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  shutdown() {
    console.log('🛑 Shutting down MCP server...');
    this.wss.close();
  }
}

// Start the server
const server = new MCPServer(process.env.PORT || 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.shutdown();
  process.exit(0);
});

module.exports = server; 