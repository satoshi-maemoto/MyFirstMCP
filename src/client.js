const WebSocket = require('ws');

class MCPClient {
  constructor(url = 'ws://localhost:3000') {
    this.url = url;
    this.ws = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.on('open', () => {
        console.log('🔗 Connected to MCP server');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 Disconnected from MCP server');
      });
    });
  }

  handleMessage(message) {
    console.log('📨 Received:', message);
    
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));
    });
  }

  async initialize() {
    console.log('🔧 Initializing...');
    return await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      clientInfo: {
        name: 'MCPTestClient',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    console.log('🛠️ Listing tools...');
    return await this.sendRequest('tools/list');
  }

  async callTool(name, args) {
    console.log(`🔧 Calling tool: ${name}`);
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async listResources() {
    console.log('📚 Listing resources...');
    return await this.sendRequest('resources/list');
  }

  async readResource(uri) {
    console.log(`📖 Reading resource: ${uri}`);
    return await this.sendRequest('resources/read', { uri });
  }

  async listNotifications() {
    console.log('🔔 Listing notifications...');
    return await this.sendRequest('notifications/list');
  }

  async subscribeToNotifications(subscriptions) {
    console.log('🔔 Subscribing to notifications...');
    return await this.sendRequest('notifications/subscribe', { subscriptions });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Test function
async function testMCPServer() {
  const client = new MCPClient();
  
  try {
    await client.connect();
    
    // Initialize
    const initResult = await client.initialize();
    console.log('✅ Initialized:', initResult);
    
    // List tools
    const tools = await client.listTools();
    console.log('✅ Tools:', tools);
    
    // Test echo tool
    const echoResult = await client.callTool('echo', { text: 'Hello MCP!' });
    console.log('✅ Echo result:', echoResult);
    
    // Test get_time tool
    const timeResult = await client.callTool('get_time', {});
    console.log('✅ Time result:', timeResult);
    
    // Test calculate tool
    const calcResult = await client.callTool('calculate', {
      operation: 'add',
      a: 10,
      b: 5
    });
    console.log('✅ Calculate result:', calcResult);
    
    // List resources
    const resources = await client.listResources();
    console.log('✅ Resources:', resources);
    
    // Read a resource
    const resourceContent = await client.readResource('file:///example.txt');
    console.log('✅ Resource content:', resourceContent);
    
    // List notifications
    const notifications = await client.listNotifications();
    console.log('✅ Notifications:', notifications);
    
    // Subscribe to notifications
    const subscribeResult = await client.subscribeToNotifications(['server/status']);
    console.log('✅ Subscribe result:', subscribeResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMCPServer();
}

module.exports = MCPClient; 