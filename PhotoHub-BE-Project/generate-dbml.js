const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/modules');
const outputFile = path.join(__dirname, 'schema.dbml');

function parseMongooseSchema(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Lấy tên bảng sạch
  let rawName = fileName.replace(/\.(model|schema|entity)?\.(js|ts)$/i, '');
  let tableName = rawName.toLowerCase();
  if (!tableName.endsWith('s')) tableName += 's';

  // Tìm vị trí new mongoose.Schema({ ... })
  const schemaStart = content.indexOf('new mongoose.Schema(');
  if (schemaStart === -1) return null;

  const bodyStart = content.indexOf('{', schemaStart);
  if (bodyStart === -1) return null;

  // Lấy các key ở ROOT level (Cấp 1) của Schema
  let dbmlTable = `Table ${tableName} {\n  _id varchar [pk]\n`;
  const rootKeys = new Set();

  // Bắt tất cả các property ở cấp 1 (không nằm trong ngoặc nhọn con)
  const lines = content.split('\n');
  let bracketDepth = 0;
  let inSchema = false;

  for (let line of lines) {
    if (line.includes('new mongoose.Schema(')) {
      inSchema = true;
      continue;
    }

    if (!inSchema) continue;

    // Tính độ sâu ngoặc nhọn
    const openBrackets = (line.match(/\{/g) || []).length;
    const closeBrackets = (line.match(/\}/g) || []).length;

    // Nếu ở cấp 1 (bracketDepth === 1)
    if (bracketDepth === 1) {
      const propMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*(.*)/);
      if (propMatch) {
        const key = propMatch[1];
        const rest = propMatch[2];

        if (!['_id', '__v', 'timestamps'].includes(key) && !rootKeys.has(key)) {
          rootKeys.add(key);

          let type = 'varchar';
          if (rest.includes('Types.ObjectId') || rest.includes('ref:')) {
            const refMatch = rest.match(/ref:\s*["']([a-zA-Z0-9_]+)["']/);
            const refTable = refMatch ? refMatch[1].toLowerCase() + 's' : 'unknown';
            type = `varchar [ref: > ${refTable}._id]`;
          } else if (rest.includes('Number')) type = 'int';
          else if (rest.includes('Boolean')) type = 'boolean';
          else if (rest.includes('Date')) type = 'datetime';
          else if (rest.startsWith('[') || rest.startsWith('{')) type = 'text'; // Object/Array nhúng

          dbmlTable += `  ${key} ${type}\n`;
        }
      }
    }

    bracketDepth += openBrackets - closeBrackets;
    if (bracketDepth <= 0 && inSchema) {
      break; // Kết thúc Schema
    }
  }

  dbmlTable += `  createdAt datetime\n  updatedAt datetime\n}\n\n`;
  return dbmlTable;
}

let dbmlResult = '// DBML Auto-Generated from Mongoose Schemas\n\n';
let count = 0;

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (
      entry.isFile() &&
      fullPath.includes(`${path.sep}models${path.sep}`) &&
      (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))
    ) {
      const dbml = parseMongooseSchema(fullPath, entry.name);
      if (dbml) {
        dbmlResult += dbml;
        count++;
        console.log(`✓ Scanned: ${entry.name}`);
      }
    }
  }
}

scan(srcDir);
fs.writeFileSync(outputFile, dbmlResult);
console.log(`\n🎉 Đã xuất thành công ${count} bảng vào file schema.dbml!`);