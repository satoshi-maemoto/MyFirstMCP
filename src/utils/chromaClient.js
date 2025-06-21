const axios = require('axios');

const COLLECTION_NAME = 'csv_rows';

// v1: コレクション作成・取得
async function getOrCreateCollection() {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  try {
    // 既存コレクション一覧取得
    const listRes = await axios.get(`${chromaUrl}/api/v1/collections`);
    console.error('Chroma API response:', JSON.stringify(listRes.data, null, 2));
    
    // v1 APIでは配列が直接返される
    const collections = Array.isArray(listRes.data) ? listRes.data : [];
    const found = collections.find(c => c.name === COLLECTION_NAME);
    
    if (found) {
      console.error(`Chroma v1: collection '${COLLECTION_NAME}' found.`);
      return found;
    }
    // なければ新規作成
    const createRes = await axios.post(`${chromaUrl}/api/v1/collections`, {
      name: COLLECTION_NAME
    });
    console.error(`Chroma v1: collection '${COLLECTION_NAME}' created.`);
    return createRes.data;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`Chroma v1: Error getting or creating collection: ${errorMsg}`);
    throw error;
  }
}

// v1: embedding登録 (add)
async function addEmbeddings(collectionId, ids, embeddings, metadatas) {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  if (!collectionId) {
    throw new Error("Collection ID is required for addEmbeddings.");
  }
  await axios.post(`${chromaUrl}/api/v1/collections/${collectionId}/add`, {
    ids,
    embeddings,
    metadatas
  });
}

// v1: 類似検索
async function queryEmbedding(collectionId, embedding, topK = 5) {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  if (!collectionId) {
    throw new Error("Collection ID is required for queryEmbedding.");
  }
  const res = await axios.post(`${chromaUrl}/api/v1/collections/${collectionId}/query`, {
    query_embeddings: [embedding],
    n_results: topK
  });
  return res.data;
}

module.exports = {
  getOrCreateCollection,
  addEmbeddings,
  queryEmbedding
}; 