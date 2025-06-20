const assert = require('assert');
const { addToVectorStore, ragSearch, embedText } = require('./mcpTools');

async function runTest() {
  // ストアを初期化（グローバルなvectorStoreなので、プロセスごとにリセットされる想定）
  // 3つのテキストを登録
  const texts = [
    'It is sunny today.',
    'It will rain tomorrow.',
    'It was very hot yesterday.'
  ];
  for (let i = 0; i < texts.length; i++) {
    const emb = await embedText(texts[i]);
    addToVectorStore(`id${i}`, emb, { text: texts[i] });
  }

  // 質問文
  const question = 'Tell me about a sunny day.';
  const results = await ragSearch(question, 2);
  assert(Array.isArray(results), 'ragSearch should return an array');
  assert(results.length > 0, 'ragSearch should return at least one result');
  // 最も近いものが「晴れ」に関するテキストであることを期待
  const topText = results[0].metadata.text;
  console.log('Top result:', topText);
  assert(topText.includes('sunny'), 'Top result should be about sunny weather');
  console.log('✅ ragSearch test passed!');
}

if (require.main === module) {
  runTest().catch(e => {
    console.error('❌ ragSearch test failed:', e);
    process.exit(1);
  });
} 