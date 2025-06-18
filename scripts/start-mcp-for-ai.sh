#!/bin/bash

# MyFirstMCP Server for AI Clients
# This script starts the MCP server for use with AI models like Claude

echo "🚀 Starting MyFirstMCP Server for AI clients..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the image if it doesn't exist
if ! docker image inspect myfirstmcp-mcp-server > /dev/null 2>&1; then
    echo "📦 Building Docker image..."
    docker-compose build
fi

# Start the MCP server
echo "🔧 Starting MCP server on port 3000..."
docker run --rm -p 3000:3000 \
    -e NODE_ENV=production \
    -e DOCKER_ENV=true \
    -e PORT=3000 \
    --name my-first-mcp-ai \
    myfirstmcp-mcp-server

echo "✅ MCP server is ready for AI clients!"
echo "📡 WebSocket URL: ws://localhost:3000"
echo "🛠️ Available tools: echo, get_time, calculate"
echo "📚 Available resources: file:///example.txt" 