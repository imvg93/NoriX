'use strict';
/**
 * Node-based runner for the NORIX Student migration (no mongosh required).
 * - Reads MongoDB URI from .env (MONGODB_URI | MONGODB_URL | DATABASE_URL).
 * - Executes the same updates as schemas/migration_plan.js.
 * - Runs the same post-migration tests and prints success/failure.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function readMongoUriFromEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return null;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  // First try well-known keys
  for (const line of lines) {
    if (!line || /^\s*[#;]/.test(line)) continue;
    const match = line.match(/^\s*(MONGODB_URI|MONGODB_URL|DATABASE_URL)\s*=\s*(.+)\s*$/);
    if (match) {
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }
  // Fallback: scan for a mongodb URL anywhere in the file
  const content = lines.join('\n');
  const urlMatch = content.match(/mongodb(?:\+srv)?:\/\/[^\s'"]+/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  return null;
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

function resolveMongoUri(projectRoot) {
  // Priority 1: explicit CLI --uri
  const cliUri = getArgValue('--uri');
  if (cliUri) return cliUri;

  // Priority 2: environment variables
  const fromEnvVar = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
  if (fromEnvVar) return fromEnvVar;

  // Priority 3: explicit CLI --env path
  const explicitEnvPath = getArgValue('--env');
  if (explicitEnvPath) {
    const p = path.isAbsolute(explicitEnvPath) ? explicitEnvPath : path.join(projectRoot, explicitEnvPath);
    const v = readMongoUriFromEnvFile(p);
    if (v) return v;
    throw new Error(`No MongoDB URI found in ${p} (keys tried: MONGODB_URI, MONGODB_URL, DATABASE_URL).`);
  }

  // Priority 4: search common .env locations
  const candidatePaths = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env.development'),
    path.join(projectRoot, '.env.production'),
    path.join(projectRoot, 'backend', '.env'),
    path.join(projectRoot, 'backend', '.env.local'),
    path.join(projectRoot, 'backend', '.env.development'),
    path.join(projectRoot, 'backend', '.env.production'),
    path.join(projectRoot, 'server', '.env'),
    path.join(projectRoot, 'server', '.env.local'),
    path.join(projectRoot, 'server', '.env.development'),
    path.join(projectRoot, 'server', '.env.production'),
    path.join(projectRoot, 'api', '.env'),
    path.join(projectRoot, 'api', '.env.local'),
    path.join(projectRoot, 'api', '.env.development'),
    path.join(projectRoot, 'api', '.env.production'),
    path.join(projectRoot, 'apps', 'backend', '.env'),
    path.join(projectRoot, 'apps', 'backend', '.env.local'),
    path.join(projectRoot, 'apps', 'backend', '.env.development'),
    path.join(projectRoot, 'apps', 'backend', '.env.production')
  ];
  for (const p of candidatePaths) {
    const v = readMongoUriFromEnvFile(p);
    if (v) return v;
  }

  throw new Error('No MongoDB connection string found. Set --uri, or --env <path>, or environment variable MONGODB_URI/MONGODB_URL/DATABASE_URL, or place a .env in a common location.');
}

async function ensureCollection(db, name) {
  const cols = await db.listCollections({ name }).toArray();
  if (cols.length === 0) {
    await db.createCollection(name);
  }
  return db.collection(name);
}

async function run() {
  const projectRoot = process.cwd();
  const mongoUri = resolveMongoUri(projectRoot);

  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  try {
    const dbName = client.db().databaseName;
    const db = client.db(dbName);
    const students = await ensureCollection(db, 'students');

    // 1) Add missing string fields safely
    await students.updateMany({ name: { $exists: false } }, { $set: { name: '' } });
    await students.updateMany({ phone: { $exists: false } }, { $set: { phone: '' } });
    await students.updateMany({ college: { $exists: false } }, { $set: { college: '' } });
    await students.updateMany({ id_doc_url: { $exists: false } }, { $set: { id_doc_url: '' } });

    // 2) Normalize arrays for skills and availability (coerce to strings)
    await students.updateMany(
      {},
      [
        {
          $set: {
            skills: {
              $cond: [
                { $isArray: '$skills' },
                { $map: { input: '$skills', as: 's', in: { $toString: '$$s' } } },
                []
              ]
            },
            availability: {
              $cond: [
                { $isArray: '$availability' },
                { $map: { input: '$availability', as: 'a', in: { $toString: '$$a' } } },
                []
              ]
            }
          }
        }
      ]
    );

    // 3) Ensure verified exists as boolean defaulting to false
    await students.updateMany(
      {
        $or: [
          { verified: { $exists: false } },
          { $expr: { $ne: [{ $type: '$verified' }, 'bool'] } }
        ]
      },
      [{ $set: { verified: false } }]
    );

    // 4) Initialize numeric fields to 0 if missing or not numeric
    const numericFields = ['reliability_score', 'total_shifts', 'no_shows'];
    for (const fieldName of numericFields) {
      const cond = {
        $or: [
          { [fieldName]: { $exists: false } },
          {
            $expr: {
              $not: {
                $in: [{ $type: `$${fieldName}` }, ['int', 'long', 'double', 'decimal']]
              }
            }
          }
        ]
      };
      const setDoc = {};
      setDoc[fieldName] = 0;
      await students.updateMany(cond, [{ $set: setDoc }]);
    }

    // 5) Recalculate reliability_score with clamping [0,100]
    await students.updateMany(
      {},
      [
        {
          $set: {
            reliability_score: {
              $let: {
                vars: {
                  ts: { $toDouble: '$total_shifts' },
                  ns: { $toDouble: '$no_shows' }
                },
                in: {
                  $cond: [
                    { $gt: ['$$ts', 0] },
                    {
                      $min: [
                        100,
                        {
                          $max: [
                            0,
                            {
                              $round: [
                                {
                                  $multiply: [
                                    100,
                                    { $divide: [{ $subtract: ['$$ts', '$$ns'] }, '$$ts'] }
                                  ]
                                },
                                0
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      ]
    );

    // --- Post-migration Tests ---
    const requiredFields = [
      'name',
      'phone',
      'college',
      'id_doc_url',
      'skills',
      'availability',
      'verified',
      'reliability_score',
      'total_shifts',
      'no_shows'
    ];

    const missingFieldCounts = {};
    for (const f of requiredFields) {
      missingFieldCounts[f] = await students.countDocuments({ [f]: { $exists: false } });
    }

    const invalidReliabilityCount = await students.countDocuments({
      $or: [
        { reliability_score: { $lt: 0 } },
        { reliability_score: { $gt: 100 } },
        { $expr: { $not: { $in: [{ $type: '$reliability_score' }, ['int', 'long', 'double', 'decimal']] } } }
      ]
    });

    const missingVerifiedOrId = await students.countDocuments({
      $or: [{ verified: { $exists: false } }, { id_doc_url: { $exists: false } }]
    });

    const totalMissingRequired = Object.values(missingFieldCounts).reduce((a, b) => a + (b || 0), 0);

    if (totalMissingRequired === 0 && invalidReliabilityCount === 0 && missingVerifiedOrId === 0) {
      console.log('✅ Student migration completed successfully.');
      process.exit(0);
    } else {
      console.error('❌ Student migration checks failed.');
      console.error({
        missingFieldCounts,
        invalidReliabilityCount,
        missingVerifiedOrId
      });
      process.exit(1);
    }
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('Migration run failed:', err.message || err);
  process.exit(1);
});


