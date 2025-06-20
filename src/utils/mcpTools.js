// mcpTools.js
// MCPツールの雛形（CSV分析・embedding・ベクトルストア・RAG検索）

const { parseCSV, filterByDateRange, filterBySize, calculateSizeStats } = require('./csvAnalyzer');
const { getEmbedding } = require('./embedding');
// embedding.jsはHuggingFace APIなどを想定
// vectorStoreはメモリ実装（後でChromaDB SDK等に差し替え可）

// メモリ上の簡易ベクトルストア
const vectorStore = [];

// テキストをembedding化（本番用）
async function embedText(text) {
  return await getEmbedding(text);
}

// embeddingをストアに追加
function addToVectorStore(id, embedding, metadata) {
  vectorStore.push({ id, embedding, metadata });
}

// embeddingで類似検索（ユークリッド距離の昇順）
function queryVectorStore(queryEmbedding, topK = 5) {
  return vectorStore
    .map(item => ({
      ...item,
      dist: Math.sqrt(item.embedding.reduce((sum, v, i) => sum + Math.pow(v - queryEmbedding[i], 2), 0))
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, topK);
}

// RAG検索：質問をembedding化し、vectorStoreで類似検索
async function ragSearch(question, topK = 5) {
  const qEmbedding = await embedText(question);
  return queryVectorStore(qEmbedding, topK);
}

module.exports = {
  parseCSV,
  filterByDateRange,
  filterBySize,
  calculateSizeStats,
  embedText,
  addToVectorStore,
  queryVectorStore,
  ragSearch
}; 