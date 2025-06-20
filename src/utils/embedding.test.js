const assert = require('assert');
const { getEmbedding } = require('./embedding');

async function runTest() {
  const testText = 'This is a test sentence.';
  try {
    const embedding = await getEmbedding(testText);
    console.log('API response:', embedding);
    assert(Array.isArray(embedding), 'Embedding should be an array');
    assert(embedding.length > 0, 'Embedding array should not be empty');
    assert(typeof embedding[0] === 'number', 'Embedding elements should be numbers');
    console.log('✅ getEmbedding test passed!');
  } catch (err) {
    console.error('❌ getEmbedding test failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runTest();
} 