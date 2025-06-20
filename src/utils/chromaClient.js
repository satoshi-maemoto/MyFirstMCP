const axios = require('axios');

const CHROMA_URL = process.env.CHROMA_URL || 'http://chroma:8000';
const COLLECTION_NAME = 'csv_rows';

// v0.5.x: get_or_createでコレクションを作成・取得する
async function getOrCreateCollection() {
  try {
    const response = await axios.post(`${CHROMA_URL}/api/v1/collections`, {
      name: COLLECTION_NAME,
      'get_or_create': true
    });
    console.log(`Chroma collection '${COLLECTION_NAME}' checked/created successfully.`);
    return response.data; // collection object including id
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`Error getting or creating collection: ${errorMsg}`);
    throw error;
  }
}

// v0.5.x: embedding登録 (upsert)
async function addEmbeddings(collectionId, ids, embeddings, metadatas) {
  if (!collectionId) {
    throw new Error("Collection ID is required for addEmbeddings.");
  }
  await axios.post(`${CHROMA_URL}/api/v1/collections/${collectionId}/upsert`, {
    ids,
    embeddings,
    metadatas
  });
}

// v0.5.x: 類似検索
async function queryEmbedding(collectionId, embedding, topK = 5) {
  if (!collectionId) {
    throw new Error("Collection ID is required for queryEmbedding.");
  }
  const res = await axios.post(`${CHROMA_URL}/api/v1/collections/${collectionId}/query`, {
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