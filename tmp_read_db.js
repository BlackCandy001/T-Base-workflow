const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'C:\\Users\\DELL\\AppData\\Roaming\\workflow-app\\elara.sqlite';
const db = new Database(dbPath);

const rows = db.prepare('SELECT * FROM config').all();
console.log(JSON.stringify(rows, null, 2));

const accounts = db.prepare('SELECT id, provider_id, email FROM accounts').all();
console.log('Accounts:', JSON.stringify(accounts, null, 2));

const providers = db.prepare('SELECT id, name FROM providers').all();
console.log('Providers:', JSON.stringify(providers, null, 2));

db.close();
