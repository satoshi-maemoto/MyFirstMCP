const axios = require('axios');

const CHROMA_URL = process.env.CHROMA_URL || 'http://chroma:8000';
const COLLECTION_NAME = 'csv_rows';

// v2: コレクション作成・取得
async function getOrCreateCollection() {
  try {
    // 既存コレクション一覧取得
    const listRes = await axios.get(`${CHROMA_URL}/api/v2/collections`);
    const found = listRes.data.collections.find(c => c.name === COLLECTION_NAME);
    if (found) {
      console.log(`Chroma v2: collection '${COLLECTION_NAME}' found.`);
      return found;
    }
    // なければ新規作成
    const createRes = await axios.post(`${CHROMA_URL}/api/v2/collections`, {
      name: COLLECTION_NAME
    });
    console.log(`Chroma v2: collection '${COLLECTION_NAME}' created.`);
    return createRes.data;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`Chroma v2: Error getting or creating collection: ${errorMsg}`);
    throw error;
  }
}

// v2: embedding登録 (upsert)
async function addEmbeddings(collectionId, ids, embeddings, metadatas) {
  if (!collectionId) {
    throw new Error("Collection ID is required for addEmbeddings.");
  }
  await axios.post(`${CHROMA_URL}/api/v2/collections/${collectionId}/upsert`, {
    ids,
    embeddings,
    metadatas
  });
}

// v2: 類似検索
async function queryEmbedding(collectionId, embedding, topK = 5) {
  if (!collectionId) {
    throw new Error("Collection ID is required for queryEmbedding.");
  }
  const res = await axios.post(`${CHROMA_URL}/api/v2/collections/${collectionId}/query`, {
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