require('dotenv').config();
const axios = require('axios');

const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
// const ENDPOINT = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
const ENDPOINT = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

async function getEmbedding(text) {
  try {
    const response = await axios.post(
      ENDPOINT,
      { inputs: [ text ] },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    return response.data[0];
  } catch (err) {
    if (err.response) {
      console.error('Embedding API error:', err.response.status, err.response.data);
    } else {
      console.error('Embedding API error:', err.message);
    }
    throw err;
  }
}

module.exports = { getEmbedding };