/* eslint-disable no-console */
/**
 * Migration: Add verification fields to Student documents and ensure indexes.
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/studentjobs';

async function connect() {
  await mongoose.connect(MONGODB_URI, { });
  console.log('✅ Connected to MongoDB');
}

async function run() {
  await connect();
  const Student = require('../backend/dist/models/Student').default || require('../backend/dist/models/Student');

  // Add defaults where missing
  const res = await Student.updateMany(
    {},
    {
      $set: {
        verified: false,
      },
      $setOnInsert: {},
    },
    { multi: true }
  );
  console.log('🛠️ Updated students with default fields:', res.modifiedCount ?? res.nModified);

  // Backfill missing reliability_score if inconsistent
  const students = await Student.find({}).select('total_shifts no_shows reliability_score').lean();
  let updated = 0;
  for (const s of students) {
    const total = s.total_shifts || 0;
    const noShows = s.no_shows || 0;
    const ratio = total > 0 ? Math.max(0, Math.min(100, Math.round((1 - Math.min(noShows, total) / total) * 100))) : 0;
    if (s.reliability_score !== ratio) {
      await Student.updateOne({ _id: s._id }, { $set: { reliability_score: ratio } });
      updated++;
    }
  }
  console.log('✅ Backfilled reliability_score on', updated, 'students');

  // Ensure helpful indexes (created in schema, but we can force)
  try {
    await Student.collection.createIndex({ verified: 1 });
    await Student.collection.createIndex({ reliability_score: 1 });
    await Student.collection.createIndex({ id_doc_hash: 1 }, { name: 'id_doc_hash_idx' });
    console.log('✅ Indexes ensured');
  } catch (e) {
    console.warn('⚠️ Index creation warning:', e.message);
  }

  await mongoose.disconnect();
  console.log('🏁 Migration complete');
}

run().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});


