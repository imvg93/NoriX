/* eslint-disable no-console */
/**
 * Auto-check worker: OCR, face-match, duplicate detection (scaffold)
 * TODO: Wire real OCR (Google Vision/AWS Rekognition/Tesseract) and face match provider.
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/studentjobs';
const CHECK_INTERVAL_MS = Number(process.env.AUTO_CHECK_INTERVAL_MS || 15000);
const BATCH_SIZE = Number(process.env.AUTO_CHECK_BATCH_SIZE || 10);
const OCR_PASS = Number(process.env.OCR_PASS_THRESHOLD || 0.8);
const OCR_FLAG = Number(process.env.OCR_FLAG_THRESHOLD || 0.6);
const FACE_PASS = Number(process.env.FACE_PASS_THRESHOLD || 0.75);
const FACE_FLAG = Number(process.env.FACE_FLAG_THRESHOLD || 0.6);

async function connect() {
  await mongoose.connect(MONGODB_URI, { });
  console.log('✅ Auto-check worker connected to MongoDB');
}

const Student = require('../backend/dist/models/Student').default || require('../backend/dist/models/Student');
const VerificationLog = require('../backend/dist/models/VerificationLog').default || require('../backend/dist/models/VerificationLog');

async function runOnce() {
  // Find students needing auto-check (new uploads or flagged)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await Student.find({
    $or: [
      { id_submitted_at: { $gte: since } },
      { video_submitted_at: { $gte: since } },
      { 'auto_checks.last_checked_at': { $exists: false } },
    ],
  })
    .sort({ id_submitted_at: -1 })
    .limit(BATCH_SIZE)
    .lean();

  if (candidates.length === 0) {
    console.log('⏳ No candidates for auto-check');
    return;
  }

  console.log(`🔍 Running auto-check for ${candidates.length} candidates`);

  for (const c of candidates) {
    // TODO: Replace with actual OCR + face-match calls
    const ocr = 0.8; // Pretend pass
    const face = 0.75; // Pretend pass
    const duplicate = false; // Pretend not a duplicate

    await Student.updateOne(
      { _id: c._id },
      {
        $set: {
          auto_checks: {
            ocr_confidence: ocr,
            face_match_score: face,
            duplicate_flag: duplicate,
            last_checked_at: new Date(),
          },
        },
      }
    );

    try {
      await VerificationLog.create({
        studentId: c._id,
        adminId: null,
        action: 'auto_check',
        code: 'AUTO_CHECK',
        details: { ocr, face, duplicate },
        timestamp: new Date(),
      });
    } catch {}
  }
}

async function main() {
  await connect();
  await runOnce();
  setInterval(runOnce, CHECK_INTERVAL_MS);
}

main().catch((e) => {
  console.error('❌ Auto-check worker failed:', e);
  process.exit(1);
});


