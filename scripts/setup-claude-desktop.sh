#!/bin/bash

# Claude Desktop MCP Setup Script
# This script sets up the MCP server for Claude Desktop

echo "🔧 Setting up MyFirstMCP for Claude Desktop..."

# Determine OS and set config directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - 正しいClaude Desktop設定ディレクトリ
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    DESKTOP_CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CONFIG_DIR="$HOME/.config/claude"
    DESKTOP_CONFIG_DIR="$HOME/.config/claude"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    CONFIG_DIR="$APPDATA/Claude"
    DESKTOP_CONFIG_DIR="$APPDATA/Claude"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "📁 Config directory: $CONFIG_DIR"
echo "📁 Desktop config directory: $DESKTOP_CONFIG_DIR"

# Create config directories if they don't exist
mkdir -p "$CONFIG_DIR"
mkdir -p "$DESKTOP_CONFIG_DIR"

# Copy the MCP config file
echo "📋 Copying MCP configuration..."
cp claude-desktop-config.json "$DESKTOP_CONFIG_DIR/claude_desktop_config.json"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image if it doesn't exist
if ! docker image inspect myfirstmcp-mcp-server > /dev/null 2>&1; then
    echo "📦 Building Docker image..."
    docker-compose build
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start the MCP server:"
echo "   docker-compose up -d"
echo ""
echo "2. Restart Claude Desktop completely"
echo ""
echo "3. The MCP server should now be available in Claude Desktop"
echo ""
echo "🛠️ Available tools:"
echo "   - echo: Echo back text"
echo "   - get_time: Get current server time"
echo "   - calculate: Perform arithmetic calculations"
echo ""
echo "📚 Available resources:"
echo "   - file:///example.txt: Example text file"
echo ""
echo "📁 Configuration file location:"
echo "   $DESKTOP_CONFIG_DIR/claude_desktop_config.json" 