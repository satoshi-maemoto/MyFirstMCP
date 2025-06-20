const axios = require('axios');

const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const ENDPOINT = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity';

async function getEmbedding(text) {
  // Send 'inputs' as an object, not a string
  const payload = {
    inputs: {
      source_sentence: text,
      sentences: [text]
    }
  };
  try {
    const response = await axios.post(
      ENDPOINT,
      payload,
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
    // The response is a similarity score array, not an embedding vector
    return response.data;
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

if (require.main === module) {
  // curlで成功した内容でAPIをテスト
  (async () => {
    const axios = require('axios');
    const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    const ENDPOINT = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity';
    const payload = {
      inputs: {
        source_sentence: "That is a happy person",
        sentences: ["That is a happy dog"]
      }
    };
    try {
      const response = await axios.post(
        ENDPOINT,
        payload,
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );
      console.log("Test embedding result:", response.data);
    } catch (err) {
      if (err.response) {
        console.error('Test embedding API error:', err.response.status, err.response.data);
      } else {
        console.error('Test embedding API error:', err.message);
      }
    }
  })();
} 