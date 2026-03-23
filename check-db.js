const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.APPDATA || process.env.HOME || '', 'Roaming', 'elara', 'elara.sqlite');
console.log('Checking database:', dbPath);

try {
  const db = new Database(dbPath);
  const accounts = db.prepare('SELECT id, provider_id, email FROM accounts').all();
  console.log('--- ACCOUNTS ---');
  console.log(accounts);
  
  const providers = db.prepare('SELECT id, name, total_accounts FROM providers').all();
  console.log('--- PROVIDERS ---');
  console.log(providers);
} catch(e) {
  console.error(e);
}
