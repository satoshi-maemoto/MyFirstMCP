# MyFirstMCP

Docker上で動作するModel Context Protocol (MCP) サーバーです。

## 概要

Model Context Protocol (MCP) は、AIモデルと外部ツール・リソース間の標準化された通信プロトコルです。このサーバーは、MCP仕様に準拠したWebSocketベースのサーバーを提供します。

## 機能

- 🚀 **MCP準拠サーバー** - Model Context Protocol 2024-11-05仕様対応
- 🐳 **Dockerコンテナ化** - 完全にDocker化されたアプリケーション
- 🛠️ **ツール提供** - echo、get_time、calculateツール
- 📚 **リソース管理** - ファイルリソースの読み取り
- 🔔 **通知システム** - サーバー状態通知
- 📡 **WebSocket通信** - リアルタイム双方向通信
- 🔧 **JSON-RPC 2.0** - 標準的なRPCプロトコル

## 提供されるツール

### echo
テキストをエコーするツール
```json
{
  "text": "Hello World"
}
```

### get_time
現在のサーバー時刻を取得
```json
{}
```

### calculate
基本的な算術計算を実行
```json
{
  "operation": "add|subtract|multiply|divide",
  "a": 10,
  "b": 5
}
```

## AIからMCPサーバーを呼び出す方法

### Claude Desktopでの設定

1. **設定ファイルを配置**
   ```bash
   # Claude Desktopの設定ディレクトリにコピー
   cp claude-desktop-config.json ~/.config/claude/desktop_config.json
   ```

2. **MCPサーバーを起動**
   ```bash
   # AI用スクリプトで起動
   ./scripts/start-mcp-for-ai.sh
   
   # または、Docker Composeで起動
   docker-compose up -d
   ```

3. **Claude Desktopを再起動**
   - Claude Desktopを完全に終了して再起動
   - MCPサーバーが利用可能になります

### Claude Webでの設定

1. **MCPサーバーを公開**
   ```bash
   # ngrokを使用してローカルサーバーを公開
   ngrok http 3000
   ```

2. **Claude Webの設定**
   - Claude Webの設定でMCPサーバーのURLを指定
   - `wss://your-ngrok-url.ngrok.io`形式で指定

### 他のAIクライアントでの設定

#### GPT-4o
- OpenAIのFunction Calling APIを使用
- MCPサーバーのツールをOpenAIのFunctionとして登録

#### カスタムAIクライアント
```javascript
// WebSocket接続例
const ws = new WebSocket('ws://localhost:3000');

// 初期化
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {}, resources: {} },
    clientInfo: { name: 'MyAIClient', version: '1.0.0' }
  }
}));
```

## クイックスタート

### 依存関係のインストール
```bash
npm install
```

### サーバーの起動
```bash
# 開発モード
npm run dev

# 本番モード
npm start

# AI用起動スクリプト
./scripts/start-mcp-for-ai.sh
```

### テストクライアントの実行
```bash
npm test
```

## Docker での実行

### Docker Compose（推奨）
```bash
# サーバーを起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# サーバーを停止
docker-compose down
```

### Dockerコマンド
```bash
# イメージをビルド
docker build -t my-first-mcp .

# コンテナを起動
docker run -d -p 3000:3000 --name mcp-server my-first-mcp

# ログを確認
docker logs -f mcp-server

# コンテナを停止・削除
docker stop mcp-server && docker rm mcp-server
```

## MCP プロトコル

### 初期化
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {}
    },
    "clientInfo": {
      "name": "MyClient",
      "version": "1.0.0"
    }
  }
}
```

### ツール一覧取得
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

### ツール呼び出し
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "text": "Hello MCP!"
    }
  }
}
```

### リソース一覧取得
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/list"
}
```

### リソース読み取り
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "resources/read",
  "params": {
    "uri": "file:///example.txt"
  }
}
```

## プロジェクト構造

```
MyFirstMCP/
├── src/
│   ├── server.js          # MCPサーバー
│   └── client.js          # テストクライアント
├── scripts/
│   └── start-mcp-for-ai.sh # AI用起動スクリプト
├── package.json           # 依存関係とスクリプト
├── Dockerfile            # Dockerイメージ定義
├── docker-compose.yml    # Docker Compose設定
├── .dockerignore         # Docker除外ファイル
├── claude-desktop-config.json # Claude Desktop設定
├── mcp-config.json       # 汎用MCP設定
├── env.example           # 環境変数例
└── README.md             # このファイル
```

## 開発

### 新しいツールを追加

`src/server.js`の`handleToolsList`メソッドに新しいツールを追加：

```javascript
{
  name: 'my_tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      // ツールのパラメータ定義
    },
    required: ['param1']
  }
}
```

そして`handleToolsCall`メソッドに処理ロジックを追加：

```javascript
case 'my_tool':
  result = { /* 処理結果 */ };
  break;
```

### 新しいリソースを追加

`handleResourcesList`メソッドに新しいリソースを追加：

```javascript
{
  uri: 'file:///my-resource.txt',
  name: 'My Resource',
  description: 'My custom resource',
  mimeType: 'text/plain'
}
```

## 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| PORT | 3000 | WebSocketサーバーのポート番号 |
| NODE_ENV | development | 実行環境 |

## テスト

### WebSocket接続テスト
```bash
# サーバーを起動
npm start

# 別のターミナルでテストクライアントを実行
npm test
```

### 手動テスト
WebSocketクライアント（wscat等）を使用：

```bash
# wscatをインストール
npm install -g wscat

# サーバーに接続
wscat -c ws://localhost:3000

# 初期化メッセージを送信
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"resources":{}},"clientInfo":{"name":"TestClient","version":"1.0.0"}}}
```

## トラブルシューティング

### MCPサーバーがAIから認識されない場合

1. **Dockerが起動しているか確認**
   ```bash
   docker info
   ```

2. **MCPサーバーが正常に動作しているか確認**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

3. **設定ファイルのパスを確認**
   - Claude Desktop: `~/.config/claude/desktop_config.json`
   - 設定ファイルのJSON形式が正しいか確認

4. **ポートが使用可能か確認**
   ```bash
   lsof -i :3000
   ```

## ライセンス

MIT

## 環境変数の設定

### 1. .envファイルの作成

プロジェクトルートに`.env`ファイルを作成してください：

```bash
# .envファイルを作成
cp env.example .env
```

### 2. 必要な環境変数の設定

`.env`ファイルを編集して、以下の環境変数を設定してください：

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
DOCKER_ENV=true

# ChromaDB Configuration
CHROMA_URL=http://chroma:8000

# Hugging Face API Configuration
HUGGING_FACE_API_TOKEN=your_actual_hugging_face_token_here
```

### 3. Hugging Face APIトークンの取得

1. [Hugging Face](https://huggingface.co/)にアカウントを作成
2. [Settings > Access Tokens](https://huggingface.co/settings/tokens)でAPIトークンを生成
3. 生成されたトークンを`.env`ファイルの`HUGGING_FACE_API_TOKEN`に設定

**注意**: `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。機密情報を安全に管理できます。