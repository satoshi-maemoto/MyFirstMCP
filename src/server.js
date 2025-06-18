const { v4: uuidv4 } = require('uuid');

class MCPServer {
  constructor() {
    this.setupStdioServer();
  }

  setupStdioServer() {
    console.error('MCP Server starting on stdio');
    
    // 標準入出力の設定
    process.stdin.setEncoding('utf8');
    process.stdout.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
      
      // 改行で区切られたメッセージを処理
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 最後の不完全な行をバッファに残す
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            console.error(`Received message:`, JSON.stringify(message, null, 2));
            this.handleMessage(message);
          } catch (error) {
            console.error(`JSON parse error:`, error.message);
            this.sendError('Invalid JSON message');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('Stdin ended');
    });

    process.on('SIGINT', () => {
      console.error('Received SIGINT, shutting down');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('Received SIGTERM, shutting down');
      process.exit(0);
    });
  }

  handleMessage(message) {
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      return this.sendError('Invalid JSON-RPC version');
    }

    const { id, method, params } = message;
    console.error(`Handling method: ${method} with id: ${id}`);

    switch (method) {
      case 'initialize':
        this.handleInitialize(id, params);
        break;
      case 'tools/list':
        this.handleToolsList(id);
        break;
      case 'tools/call':
        this.handleToolsCall(id, params);
        break;
      case 'resources/list':
        this.handleResourcesList(id);
        break;
      case 'resources/read':
        this.handleResourcesRead(id, params);
        break;
      case 'notifications/list':
        this.handleNotificationsList(id);
        break;
      case 'notifications/subscribe':
        this.handleNotificationsSubscribe(id, params);
        break;
      default:
        this.sendError(`Unknown method: ${method}`, id);
    }
  }

  handleInitialize(id, params) {
    console.error(`Handling initialize request with id: ${id}`);
    const response = {
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
    };
    console.error(`Sending initialize response:`, JSON.stringify(response, null, 2));
    this.sendMessage(response);
  }

  handleToolsList(id) {
    this.sendMessage({
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

  handleToolsCall(id, params) {
    const { name, arguments: args } = params;
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
      
      this.sendMessage({
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
      this.sendError(error.message, id);
    }
  }

  handleResourcesList(id) {
    this.sendMessage({
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

  handleResourcesRead(id, params) {
    const { uri } = params;
    
    if (uri === 'file:///example.txt') {
      this.sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri: 'file:///example.txt',
              mimeType: 'text/plain',
              text: 'Hello from MyFirstMCP server!\nThis is an example resource file.'
            }
          ]
        }
      });
    } else {
      this.sendError(`Resource not found: ${uri}`, id);
    }
  }

  handleNotificationsList(id) {
    this.sendMessage({
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

  handleNotificationsSubscribe(id, params) {
    const { subscriptions } = params;
    
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        subscriptions: subscriptions.map(sub => ({
          method: sub.method,
          active: true
        }))
      }
    });
  }

  sendMessage(message) {
    const messageStr = JSON.stringify(message);
    console.error(`Sending message:`, messageStr);
    process.stdout.write(messageStr + '\n');
  }

  sendError(message, id = null) {
    const errorMessage = {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: message
      }
    };
    
    if (id !== null) {
      errorMessage.id = id;
    }
    
    this.sendMessage(errorMessage);
  }

  shutdown() {
    process.exit(0);
  }
}

// サーバー起動
const server = new MCPServer();

module.exports = server; 