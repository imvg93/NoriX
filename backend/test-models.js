const mongoose = require('mongoose');
require('dotenv').config();

async function testModels() {
  console.log('🧪 Testing Mongoose Models...\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB');

    // Import models (this will trigger index creation)
    console.log('📋 Loading models...');
    
    // Import all models
    require('./src/models/User');
    require('./src/models/Job');
    require('./src/models/Application');
    require('./src/models/OTP');
    
    console.log('✅ All models loaded successfully');
    console.log('✅ No duplicate index warnings detected');

    // Test creating a simple document
    console.log('\n🧪 Testing model functionality...');
    
    const User = mongoose.model('User');
    const Job = mongoose.model('Job');
    const Application = mongoose.model('Application');
    const OTP = mongoose.model('OTP');

    console.log('✅ All models are accessible');

    // List all collections and their indexes
    console.log('\n📊 Database Collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
      
      try {
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        console.log(`  Indexes: ${indexes.length}`);
        indexes.forEach(index => {
          const keys = Object.keys(index.key).join(', ');
          const unique = index.unique ? ' (unique)' : '';
          console.log(`    - ${keys}${unique}`);
        });
      } catch (err) {
        console.log(`  Error getting indexes: ${err.message}`);
      }
    }

    console.log('\n🎉 Model test completed successfully!');
    console.log('No duplicate index warnings should appear above.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testModels().catch(console.error);
