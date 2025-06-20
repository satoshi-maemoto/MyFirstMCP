const { spawn } = require('child_process');

class MCPStdioClient {
  constructor(serverCmd = ['node', 'src/server.js']) {
    this.serverCmd = serverCmd;
    this.proc = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.buffer = '';
  }

  startServer() {
    return new Promise((resolve, reject) => {
      this.proc = spawn(this.serverCmd[0], this.serverCmd.slice(1), {
        stdio: ['pipe', 'pipe', 'inherit']
      });
      this.proc.stdout.setEncoding('utf8');
      this.proc.stdout.on('data', (chunk) => {
        this.buffer += chunk;
        let lines = this.buffer.split('\n');
        this.buffer = lines.pop();
        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              this.handleMessage(message);
            } catch (e) {
              // ignore non-JSON lines
            }
          }
        }
      });
      this.proc.on('spawn', () => {
        resolve();
      });
      this.proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  handleMessage(message) {
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
      this.proc.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  async initialize() {
    return await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: {} },
      clientInfo: { name: 'MCPTestClient', version: '1.0.0' }
    });
  }

  async listTools() {
    return await this.sendRequest('tools/list');
  }

  async callTool(name, args) {
    return await this.sendRequest('tools/call', { name, arguments: args });
  }

  async stopServer() {
    if (this.proc) {
      this.proc.kill();
    }
  }
}

// テスト関数
async function testMCPServer() {
  const client = new MCPStdioClient();
  try {
    await client.startServer();
    const initResult = await client.initialize();
    console.log('✅ Initialized:', initResult);
    const tools = await client.listTools();
    console.log('✅ Tools:', tools);
    const echoResult = await client.callTool('echo', { text: 'Hello MCP!' });
    console.log('✅ Echo result:', echoResult);
    const timeResult = await client.callTool('get_time', {});
    console.log('✅ Time result:', timeResult);
    const calcResult = await client.callTool('calculate', { operation: 'add', a: 10, b: 5 });
    console.log('✅ Calculate result:', calcResult);
    // csv_analyze: stats
    const csvStats = await client.callTool('csv_analyze', {
      action: 'stats',
      startDate: '2024-05-01',
      endDate: '2024-06-30',
      minSize: 70,
      maxSize: 80
    });
    console.log('✅ CSV stats:', csvStats);
    // csv_analyze: filter_date
    const csvDateFiltered = await client.callTool('csv_analyze', {
      action: 'filter_date',
      startDate: '2024-06-01',
      endDate: '2024-06-30'
    });
    console.log('✅ CSV filter_date:', csvDateFiltered);
    // csv_analyze: filter_size
    const csvSizeFiltered = await client.callTool('csv_analyze', {
      action: 'filter_size',
      minSize: 70,
      maxSize: 80
    });
    console.log('✅ CSV filter_size:', csvSizeFiltered);
    // rag_queryテスト（embedding未完了時はリトライ）
    let ragResult = null;
    let retry = 0;
    const maxRetry = 10;
    while (retry < maxRetry) {
      try {
        ragResult = await client.callTool('rag_query', {
          question: '2023年の売上が最も大きい行は？',
          topK: 3
        });
        break;
      } catch (e) {
        if (e.message && e.message.includes('CSV embedding未完了')) {
          retry++;
          console.log(`⏳ embedding完了待ち... リトライ${retry}/${maxRetry}`);
          await new Promise(res => setTimeout(res, 2000));
        } else {
          throw e;
        }
      }
    }
    if (ragResult) {
      console.log('✅ RAG result:', ragResult);
    } else {
      console.error('❌ RAG embedding完了せずタイムアウト');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.stopServer();
  }
}

if (require.main === module) {
  testMCPServer();
}

module.exports = MCPStdioClient; 