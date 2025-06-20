const MCPStdioClient = require('./client');

async function testRagSearch() {
  const client = new MCPStdioClient();
  try {
    await client.startServer();
    await client.initialize();
    const ragResult = await client.callTool('rag_search', {
      question: 'Tell me about a sunny day.',
      topK: 2
    });
    console.log('✅ RAG search result:', JSON.stringify(ragResult, null, 2));
  } catch (error) {
    console.error('❌ RAG search test failed:', error);
  } finally {
    await client.stopServer();
  }
}

if (require.main === module) {
  testRagSearch();
} 