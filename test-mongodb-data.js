// Simple test to verify admin endpoints work
const express = require('express');
const mongoose = require('mongoose');

// Test MongoDB connection
async function testMongoDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studentjobs');
    console.log('✅ MongoDB connected');
    
    // Test if collections exist
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections:', collections.map(c => c.name));
    
    // Test User model
    const User = require('./dist/models/User').default;
    const userCount = await User.countDocuments();
    console.log('👥 Total users:', userCount);
    
    // Test Job model
    const Job = require('./dist/models/Job').default;
    const jobCount = await Job.countDocuments();
    console.log('💼 Total jobs:', jobCount);
    
    // Test Application model
    const Application = require('./dist/models/Application').default;
    const appCount = await Application.countDocuments();
    console.log('📝 Total applications:', appCount);
    
    // Test KYC model
    const KYC = require('./dist/models/KYC').default;
    const kycCount = await KYC.countDocuments();
    console.log('🆔 Total KYC records:', kycCount);
    
    // Test EmployerKYC model
    const EmployerKYC = require('./dist/models/EmployerKYC').EmployerKYC;
    const employerKycCount = await EmployerKYC.countDocuments();
    console.log('🏢 Total Employer KYC records:', employerKycCount);
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMongoDB();

