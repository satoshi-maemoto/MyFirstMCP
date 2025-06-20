const { v4: uuidv4 } = require('uuid');
const path = require('path');
const csvAnalyzer = require('./utils/csvAnalyzer');
const embedding = require('./utils/embedding');
const chromaClient = require('./utils/chromaClient');
const fs = require('fs');
require('dotenv').config();

console.error('HUGGINGFACE_API_TOKEN:', process.env.HUGGINGFACE_API_TOKEN);

class MCPServer {
  constructor() {
    this.setupStdioServer();
    this.csvEmbeddingsReady = false;
    this.csvRows = [];
    this.chromaCollection = null;
    // 非同期処理を適切に開始
    this.initCsvEmbeddings().catch(err => {
      console.error('Failed to initialize CSV embeddings:', err);
    });
  }

  async initCsvEmbeddings() {
    // サーバー起動時にCSVデータをembeddingしてChromaに登録
    const filePath = path.join(__dirname, 'data', 'sample.csv');
    if (!fs.existsSync(filePath)) {
      console.error('CSV file not found:', filePath);
      return;
    }
    console.error('Starting CSV embedding initialization...');
    const data = await csvAnalyzer.parseCSV(filePath);
    this.csvRows = data;
    console.error(`Parsed ${data.length} CSV rows`);
    this.chromaCollection = await chromaClient.getOrCreateCollection();
    const ids = [];
    const embeddings = [];
    const metadatas = [];
    for (let i = 0; i < data.length; ++i) {
      const row = data[i];
      const text = JSON.stringify(row);
      try {
        const emb = await embedding.getEmbedding(text);
        ids.push(`row_${i}`);
        embeddings.push(emb);
        metadatas.push({ index: i });
        console.error(`Embedded row ${i + 1}/${data.length}`);
      } catch (e) {
        console.error(`Failed to embed row ${i}:`, e.message);
        // embedding失敗時はスキップ
      }
    }
    if (ids.length > 0) {
      await chromaClient.addEmbeddings(this.chromaCollection.id, ids, embeddings, metadatas);
      console.error(`Successfully added ${ids.length} embeddings to Chroma`);
    }
    this.csvEmbeddingsReady = true;
    console.error('CSV embedding initialization completed');
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

    if (typeof id === "undefined") {
      // 通知なので何も返さない
      return;
    }

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
          },
          {
            name: 'csv_analyze',
            description: 'Analyze sample.csv by date/size. Actions: stats, filter_date, filter_size',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['stats', 'filter_date', 'filter_size'],
                  description: 'Analysis type: stats, filter_date, filter_size'
                },
                startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                minSize: { type: 'number', description: 'Minimum size' },
                maxSize: { type: 'number', description: 'Maximum size' }
              },
              required: ['action']
            }
          },
          {
            name: 'rag_query',
            description: '質問文をembeddingし、CSVデータから類似行を検索してLLMで回答生成',
            inputSchema: {
              type: 'object',
              properties: {
                question: { type: 'string', description: '質問文' },
                topK: { type: 'number', description: '検索上位件数', default: 3 }
              },
              required: ['question']
            }
          }
        ]
      }
    });
  }

  async handleToolsCall(id, params) {
    const { name, arguments: args } = params;
    try {
      let result;
      switch (name) {
        case 'echo':
          result = { echoedText: args.text };
          break;
        case 'get_time':
          result = { time: new Date().toISOString() };
          break;
        case 'calculate':
          {
            const { operation, a, b } = args;
            if (operation === 'add') result = { result: a + b };
            else if (operation === 'subtract') result = { result: a - b };
            else if (operation === 'multiply') result = { result: a * b };
            else if (operation === 'divide') {
              if (b === 0) throw new Error('Division by zero');
              result = { result: a / b };
            }
          }
          break;
        case 'csv_analyze':
          {
            const filePath = path.join(__dirname, 'data', 'sample.csv');
            const data = await csvAnalyzer.parseCSV(filePath);
            switch (args.action) {
              case 'stats':
                let filtered = data;
                if (args.startDate && args.endDate) {
                  filtered = csvAnalyzer.filterByDateRange(filtered, args.startDate, args.endDate);
                }
                if (typeof args.minSize === 'number' && typeof args.maxSize === 'number') {
                  filtered = csvAnalyzer.filterBySize(filtered, args.minSize, args.maxSize);
                }
                result = csvAnalyzer.calculateSizeStats(filtered);
                break;
              case 'filter_date':
                result = csvAnalyzer.filterByDateRange(data, args.startDate, args.endDate);
                break;
              case 'filter_size':
                result = csvAnalyzer.filterBySize(data, args.minSize, args.maxSize);
                break;
              default:
                throw new Error('Unknown action for csv_analyze');
            }
          }
          break;
        case 'rag_query': {
          if (!this.csvEmbeddingsReady || !this.chromaCollection) {
            this.sendError('CSV Embeddings are not ready yet.', id);
            return; // handleToolsCallは値を返さないので、ここで終了
          }
          const { question, topK } = args;
          const queryEmbedding = await embedding.getEmbedding(question);
          const results = await chromaClient.queryEmbedding(this.chromaCollection.id, queryEmbedding, topK || 3);
          
          // resultsからindicesとmetadatasを抽出
          const indices = results.metadatas[0].map(m => m.index);
          const hits = indices.map(idx => this.csvRows[idx]);
          
          // LLMで回答生成
          const context = hits.map(row => JSON.stringify(row)).join('\n');
          const llmAnswer = await callHuggingfaceLLM(question, context);
          result = { answer: llmAnswer, context: hits };
          break;
        }
      }
      this.sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          tool_call_id: params.tool_call_id,
          tool_name: name,
          result
        }
      });
    } catch (error) {
      console.error(`Error in tool call ${name}:`, error);
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

// HuggingFace Inference APIでLLM呼び出し
async function callHuggingfaceLLM(question, context) {
  const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
  const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
  const prompt = `質問: ${question}\n\n参考データ:\n${context}\n\n回答:`;
  const response = await require('axios').post(
    `https://api-inference.huggingface.co/models/${MODEL}`,
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );
  if (Array.isArray(response.data)) {
    return response.data[0]?.generated_text || '';
  }
  if (typeof response.data.generated_text === 'string') {
    return response.data.generated_text;
  }
  return JSON.stringify(response.data);
}

// サーバー起動
const server = new MCPServer();

module.exports = server; 