const path = require('path');
const {
  parseCSV,
  embedText,
  addToVectorStore
} = require('./mcpTools');

async function registerCSVRowsToVectorStore(csvPath) {
  // 1. CSVパース
  const rows = await parseCSV(csvPath);

  // 2. 各行をテキスト化＆embedding化＆vectorStore登録
  for (const [i, row] of rows.entries()) {
    // 例：全カラムを連結してテキスト化
    const text = Object.values(row).join(' ');
    const embedding = await embedText(text);
    console.log(`row_${i} embedding:`, embedding);
    addToVectorStore(`row_${i}`, embedding, row);
  }

  console.log(`✅ ${rows.length} rows registered to vectorStore.`);
}

// サンプルCSVファイルで実行
if (require.main === module) {
  const csvPath = path.join(__dirname, '../data/sample.csv'); // データディレクトリのCSVを使用
  registerCSVRowsToVectorStore(csvPath);
} 