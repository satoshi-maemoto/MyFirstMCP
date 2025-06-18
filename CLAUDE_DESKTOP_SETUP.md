# Claude Desktop セットアップガイド

このガイドでは、MyFirstMCPサーバーをClaude Desktopで使用するための設定方法を説明します。

## 前提条件

- Claude Desktopがインストールされている
- Dockerがインストールされ、起動している
- Node.jsがインストールされている（開発用）

## 自動セットアップ（推奨）

### 1. セットアップスクリプトを実行

```bash
# セットアップスクリプトを実行
./scripts/setup-claude-desktop.sh
```

このスクリプトは以下を自動で実行します：
- OSに応じた設定ディレクトリの特定
- 設定ファイルの配置
- Dockerイメージのビルド

### 2. MCPサーバーを起動

```bash
# Docker Composeでサーバーを起動
docker-compose up -d
```

### 3. Claude Desktopを再起動

Claude Desktopを完全に終了して再起動してください。

## 手動セットアップ

### macOS

1. **設定ディレクトリを作成**
   ```bash
   mkdir -p ~/.config/claude
   ```

2. **設定ファイルをコピー**
   ```bash
   cp claude-desktop-config.json ~/.config/claude/desktop_config.json
   ```

3. **Dockerイメージをビルド**
   ```bash
   docker-compose build
   ```

4. **MCPサーバーを起動**
   ```bash
   docker-compose up -d
   ```

5. **Claude Desktopを再起動**

### Linux

1. **設定ディレクトリを作成**
   ```bash
   mkdir -p ~/.config/claude
   ```

2. **設定ファイルをコピー**
   ```bash
   cp claude-desktop-config.json ~/.config/claude/desktop_config.json
   ```

3. **Dockerイメージをビルド**
   ```bash
   docker-compose build
   ```

4. **MCPサーバーを起動**
   ```bash
   docker-compose up -d
   ```

5. **Claude Desktopを再起動**

### Windows

1. **設定ディレクトリを作成**
   ```cmd
   mkdir "%APPDATA%\Claude"
   ```

2. **設定ファイルをコピー**
   ```cmd
   copy claude-desktop-config.json "%APPDATA%\Claude\desktop_config.json"
   ```

3. **Dockerイメージをビルド**
   ```cmd
   docker-compose build
   ```

4. **MCPサーバーを起動**
   ```cmd
   docker-compose up -d
   ```

5. **Claude Desktopを再起動**

## 設定の確認

### 1. 設定ファイルの内容確認

```bash
cat ~/.config/claude/desktop_config.json
```

### 2. MCPサーバーの動作確認

```bash
# サーバーの状態確認
docker-compose ps

# ログの確認
docker-compose logs

# テストクライアントで動作確認
npm test
```

## 利用可能なツール

### echo
テキストをエコーするツール

**使用例:**
```
echo "Hello World"
```

### get_time
現在のサーバー時刻を取得

**使用例:**
```
get_time
```

### calculate
基本的な算術計算を実行

**使用例:**
```
calculate add 10 5
calculate multiply 3 7
calculate divide 20 4
```

## 利用可能なリソース

### file:///example.txt
サンプルテキストファイル

**使用例:**
```
read file:///example.txt
```

## トラブルシューティング

### MCPサーバーが認識されない場合

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
   ```bash
   ls -la ~/.config/claude/desktop_config.json
   ```

4. **設定ファイルのJSON形式を確認**
   ```bash
   cat ~/.config/claude/desktop_config.json | jq .
   ```

5. **Claude Desktopを完全に再起動**
   - プロセスを完全に終了
   - 再起動

### ポートが使用中の場合

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# 既存のコンテナを停止
docker-compose down

# 再起動
docker-compose up -d
```

### 権限エラーの場合

```bash
# 設定ディレクトリの権限を確認
ls -la ~/.config/claude/

# 必要に応じて権限を修正
chmod 644 ~/.config/claude/desktop_config.json
```

## 設定ファイルの詳細

`claude-desktop-config.json`の構造：

```json
{
  "mcpServers": {
    "my-first-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-p", "3000:3000", "myfirstmcp-mcp-server"],
      "env": {
        "NODE_ENV": "production",
        "DOCKER_ENV": "true",
        "PORT": "3000"
      },
      "description": "My First MCP Server with echo, time, and calculation tools",
      "capabilities": {
        "tools": {
          // ツールの定義
        },
        "resources": {
          // リソースの定義
        }
      }
    }
  }
}
```

## 更新とメンテナンス

### MCPサーバーの更新

```bash
# 最新のコードを取得
git pull

# Dockerイメージを再ビルド
docker-compose build

# サーバーを再起動
docker-compose down
docker-compose up -d
```

### 設定の更新

設定を変更した場合は、Claude Desktopを再起動してください。

## サポート

問題が発生した場合は、以下を確認してください：

1. Dockerが正常に動作しているか
2. MCPサーバーが起動しているか
3. 設定ファイルが正しい場所にあるか
4. Claude Desktopが最新版か

詳細なログが必要な場合は：

```bash
docker-compose logs -f
``` 