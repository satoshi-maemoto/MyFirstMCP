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
├── package.json           # 依存関係とスクリプト
├── Dockerfile            # Dockerイメージ定義
├── docker-compose.yml    # Docker Compose設定
├── .dockerignore         # Docker除外ファイル
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

## ライセンス

MIT