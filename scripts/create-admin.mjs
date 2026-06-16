#!/usr/bin/env node
/**
 * Interactive CLI to create / update admin users in the database.
 * Usage:  node scripts/create-admin.mjs
 * Reads DB credentials from .env in the project root.
 */

import { createInterface } from 'readline';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// ── DB config from env ────────────────────────────────────────────────────────
const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'solarapp',
};

// ── readline helpers ──────────────────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask  = (q)        => new Promise(res => rl.question(q, res));
const askSecret = (q)   => new Promise(res => {
  process.stdout.write(q);
  process.stdin.setRawMode?.(true);
  let val = '';
  const handler = (buf) => {
    const ch = buf.toString();
    if (ch === '\r' || ch === '\n') {
      process.stdin.setRawMode?.(false);
      process.stdin.removeListener('data', handler);
      process.stdout.write('\n');
      res(val);
    } else if (ch === '') {          // Ctrl-C
      process.stdout.write('\n');
      process.exit(0);
    } else if (ch === '' || ch === '\b') { // backspace
      if (val.length) { val = val.slice(0, -1); process.stdout.write('\b \b'); }
    } else {
      val += ch;
      process.stdout.write('*');
    }
  };
  process.stdin.resume();
  process.stdin.on('data', handler);
});

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n╔════════════════════════════════════════╗');
console.log('║   Prosumer.ba — Create Admin User CLI  ║');
console.log('╚════════════════════════════════════════╝\n');

const client = new Client(DB);

try {
  await client.connect();
  console.log(`✔  Connected to database "${DB.database}" on ${DB.host}:${DB.port}\n`);
} catch (err) {
  console.error(`✖  Could not connect to database: ${err.message}`);
  process.exit(1);
}

// ── Prompt ────────────────────────────────────────────────────────────────────
const email       = (await ask('  Email address : ')).trim().toLowerCase();
const displayName = (await ask('  Display name  : ')).trim();
const password    = await askSecret('  Password      : ');
const confirm     = await askSecret('  Confirm pw    : ');

if (!email || !password) {
  console.error('\n✖  Email and password are required.');
  await client.end(); rl.close(); process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('\n✖  Invalid email address.');
  await client.end(); rl.close(); process.exit(1);
}
if (password !== confirm) {
  console.error('\n✖  Passwords do not match.');
  await client.end(); rl.close(); process.exit(1);
}
if (password.length < 6) {
  console.error('\n✖  Password must be at least 6 characters.');
  await client.end(); rl.close(); process.exit(1);
}

// ── Check for existing user ───────────────────────────────────────────────────
const existing = await client.query(
  'SELECT id FROM admin_users WHERE email = $1',
  [email],
);

const hash = await bcrypt.hash(password, 12);
console.log('\n  Hashing password…');

if (existing.rows.length > 0) {
  const overwrite = (await ask(`\n  ⚠  User "${email}" already exists. Update password? (y/N) : `))
    .trim().toLowerCase();
  if (overwrite !== 'y') {
    console.log('  Aborted — no changes made.');
    await client.end(); rl.close(); process.exit(0);
  }
  await client.query(
    'UPDATE admin_users SET "passwordHash" = $1, "displayName" = $2 WHERE email = $3',
    [hash, displayName || existing.rows[0].displayName, email],
  );
  console.log(`\n✔  Password updated for ${email}`);
} else {
  await client.query(
    `INSERT INTO admin_users (email, "passwordHash", "displayName", "isActive", "createdAt")
     VALUES ($1, $2, $3, true, NOW())`,
    [email, hash, displayName || null],
  );
  console.log(`\n✔  Admin user created: ${email}`);
}

await client.end();
rl.close();
console.log('   Done.\n');
