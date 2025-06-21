const MCPStdioClient = require('./client');

async function testRagSearch(question = 'Tell me about a sunny day.', topK = 2) {
  const client = new MCPStdioClient();
  try {
    await client.startServer();
    await client.initialize();
    const ragResult = await client.callTool('rag_search', {
      question: question,
      topK: topK
    });
    console.log('✅ RAG search result:', JSON.stringify(ragResult, null, 2));
  } catch (error) {
    console.error('❌ RAG search test failed:', error);
  } finally {
    await client.stopServer();
  }
}

if (require.main === module) {
  const question = process.argv[2] || 'Tell me about a sunny day.';
  const topK = parseInt(process.argv[3]) || 2;
  console.log(`Testing RAG search with question: "${question}", topK: ${topK}`);
  testRagSearch(question, topK);
} 