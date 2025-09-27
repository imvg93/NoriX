#!/usr/bin/env node

// Utility script to lookup a job by ID and optionally update status
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from './src/models/Job';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

const [,, jobId, newStatus] = process.argv;

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  if (!jobId || jobId === '--list') {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(10);
    if (jobs.length === 0) {
      console.log('No jobs found in the database.');
    } else {
      console.log('Showing up to 10 recent jobs:');
      jobs.forEach(job => {
        console.log({
          id: job._id.toString(),
          title: job.jobTitle,
          status: job.status,
          employerId: job.employerId?.toString(),
          highlighted: job.highlighted,
          createdAt: job.createdAt,
        });
      });
    }
    await mongoose.disconnect();
    return;
  }

  const job = await Job.findById(jobId);

  if (!job) {
    console.log('❌ Job not found for ID:', jobId);
  } else {
    console.log('✅ Job found:');
    console.log({
      id: job._id.toString(),
      title: job.jobTitle,
      status: job.status,
      employerId: job.employerId?.toString(),
      highlighted: job.highlighted,
      createdAt: job.createdAt,
    });

    if (newStatus) {
      job.status = newStatus as any;
      await job.save();
      console.log('🔄 Updated status to', newStatus);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});

