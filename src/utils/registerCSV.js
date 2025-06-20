const path = require('path');
const {
  parseCSV,
  embedText
} = require('./mcpTools');
const { getOrCreateCollection, addEmbeddings } = require('./chromaClient');

async function registerCSVRowsToChromaDB(csvPath) {
  // 1. CSVパース
  const rows = await parseCSV(csvPath);

  // 2. 各行をテキスト化＆embedding化
  const ids = [];
  const embeddings = [];
  const metadatas = [];
  for (const [i, row] of rows.entries()) {
    const text = Object.values(row).join(' ');
    const embedding = await embedText(text);
    ids.push(`row_${i}`);
    embeddings.push(embedding);
    metadatas.push(row);
  }

  // 3. ChromaDBに一括登録
  const collection = await getOrCreateCollection();
  await addEmbeddings(collection.id || collection.collection_id, ids, embeddings, metadatas);
  console.log(`✅ ${rows.length} rows registered to ChromaDB.`);
}

// サンプルCSVファイルで実行
if (require.main === module) {
  const csvPath = path.join(__dirname, '../data/sample.csv');
  registerCSVRowsToChromaDB(csvPath);
}

module.exports = { registerCSVRowsToChromaDB }; 