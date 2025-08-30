require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 Testing MongoDB Atlas Connection...');
console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('whitelist')) {
      console.log('\n💡 Solution: Add your IP to MongoDB Atlas whitelist');
      console.log('   1. Go to MongoDB Atlas Dashboard');
      console.log('   2. Security → Network Access');
      console.log('   3. Add IP: 124.123.188.151');
      console.log('   4. Or click "ALLOW ACCESS FROM ANYWHERE"');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
