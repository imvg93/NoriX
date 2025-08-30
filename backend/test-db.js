const mongoose = require('mongoose');

// MongoDB URI - same as your backend
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

console.log('🔍 Testing MongoDB Connection...');
console.log('📡 MongoDB URI:', MONGODB_URI);

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get database info
    const db = mongoose.connection.db;
    console.log('📊 Database Name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections found:', collections.length);
    
    if (collections.length === 0) {
      console.log('⚠️ No collections found. This is normal for a new database.');
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // Test creating a sample document
    console.log('\n🧪 Testing document creation...');
    
    // Create a test collection
    const testCollection = db.collection('test_collection');
    
    // Insert a test document
    const result = await testCollection.insertOne({
      test: 'Hello MongoDB!',
      timestamp: new Date(),
      message: 'This is a test document to verify database connectivity'
    });
    
    console.log('✅ Test document created successfully!');
    console.log('📄 Document ID:', result.insertedId);
    
    // Count documents in each collection
    console.log('\n📈 Document counts:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution: Make sure MongoDB is running on your system');
      console.log('   - Install MongoDB Community Edition');
      console.log('   - Start MongoDB service');
      console.log('   - Or use MongoDB Atlas (cloud)');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Solution: Check your MongoDB URI');
      console.log('   - Verify the host and port');
      console.log('   - Check if MongoDB is running');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testDatabase();
