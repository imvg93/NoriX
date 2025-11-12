'use strict';
/**
 * Apply JSON Schema validator and create indexes for students collection (Node-based).
 * Usage examples:
 *   node scripts/apply_student_validator_indexes_node.js --env backend/.env
 *   node scripts/apply_student_validator_indexes_node.js --uri "mongodb+srv://..."
 *   MONGODB_URI="..." node scripts/apply_student_validator_indexes_node.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return null;
}

function readMongoUriFromEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return null;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*[#;]/.test(line)) continue;
    const m = line.match(/^\s*(MONGODB_URI|MONGODB_URL|DATABASE_URL)\s*=\s*(.+)\s*$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v;
    }
  }
  const content = lines.join('\n');
  const urlMatch = content.match(/mongodb(?:\+srv)?:\/\/[^\s'"]+/i);
  return urlMatch ? urlMatch[0] : null;
}

function resolveMongoUri(projectRoot) {
  const cliUri = getArgValue('--uri');
  if (cliUri) return cliUri;
  const fromEnv = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
  if (fromEnv) return fromEnv;
  const explicitEnvPath = getArgValue('--env');
  if (explicitEnvPath) {
    const p = path.isAbsolute(explicitEnvPath) ? explicitEnvPath : path.join(projectRoot, explicitEnvPath);
    const v = readMongoUriFromEnvFile(p);
    if (v) return v;
    throw new Error(`No MongoDB URI found in ${p}.`);
  }
  const candidates = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env.development'),
    path.join(projectRoot, '.env.production'),
    path.join(projectRoot, 'backend', '.env'),
    path.join(projectRoot, 'backend', '.env.local'),
    path.join(projectRoot, 'backend', '.env.development'),
    path.join(projectRoot, 'backend', '.env.production')
  ];
  for (const p of candidates) {
    const v = readMongoUriFromEnvFile(p);
    if (v) return v;
  }
  throw new Error('No MongoDB URI available. Use --uri or --env or set MONGODB_URI.');
}

async function run() {
  const projectRoot = process.cwd();
  const mongoUri = resolveMongoUri(projectRoot);
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  try {
    const db = client.db();
    const schemaPath = path.join(projectRoot, 'schemas', 'student.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const collections = await db.listCollections({ name: 'students' }).toArray();
    if (collections.length > 0) {
      try {
        await db.command({
          collMod: 'students',
          validator: { $jsonSchema: schema },
          validationLevel: 'strict',
          validationAction: 'error'
        });
        console.log('✅ Applied JSON Schema validator to students');
      } catch (e) {
        console.log('⚠️ collMod failed, continuing:', e.message || e);
      }
    } else {
      await db.createCollection('students', {
        validator: { $jsonSchema: schema },
        validationLevel: 'strict',
        validationAction: 'error'
      });
      console.log('✅ Created students with JSON Schema validator');
    }

    const coll = db.collection('students');
    await Promise.allSettled([
      coll.createIndex({ verified: 1 }, { name: 'verified_1', background: true }),
      coll.createIndex({ reliability_score: -1 }, { name: 'reliability_score_-1', background: true }),
      coll.createIndex({ skills: 1 }, { name: 'skills_1', background: true }),
      coll.createIndex({ college: 1 }, { name: 'college_1', background: true })
    ]);
    console.log('✅ Ensured students indexes (verified, reliability_score, skills, college)');
    console.log('✅ Done.');
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('❌ Failed to apply validator/indexes:', err.message || err);
  process.exit(1);
});


