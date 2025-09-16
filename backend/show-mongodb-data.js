const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function showMongoDBCollections() {
  try {
    await connectDB();
    
    console.log('\n🔍 CHECKING MONGODB COLLECTIONS AND DATA\n');
    console.log('=' .repeat(60));
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections (${collections.length}):`);
    console.log('-'.repeat(40));
    
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Check each collection for data
    for (const collection of collections) {
      console.log(`\n📋 Collection: ${collection.name}`);
      console.log('-'.repeat(40));
      
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   📊 Document Count: ${count}`);
      
      if (count > 0) {
        // Show first few documents
        const documents = await mongoose.connection.db.collection(collection.name).find({}).limit(3).toArray();
        console.log(`   📄 Sample Documents:`);
        
        documents.forEach((doc, index) => {
          console.log(`\n   ${index + 1}. Document ID: ${doc._id}`);
          
          // Show key fields based on collection type
          if (collection.name === 'users') {
            console.log(`      Name: ${doc.name || 'N/A'}`);
            console.log(`      Email: ${doc.email || 'N/A'}`);
            console.log(`      User Type: ${doc.userType || 'N/A'}`);
            console.log(`      Active: ${doc.isActive || 'N/A'}`);
            console.log(`      Created: ${doc.createdAt || 'N/A'}`);
          } else if (collection.name === 'adminlogins') {
            console.log(`      Admin Email: ${doc.adminEmail || 'N/A'}`);
            console.log(`      Admin Name: ${doc.adminName || 'N/A'}`);
            console.log(`      Login Time: ${doc.loginTime || 'N/A'}`);
            console.log(`      Status: ${doc.loginStatus || 'N/A'}`);
            console.log(`      IP: ${doc.ipAddress || 'N/A'}`);
          } else if (collection.name === 'kycs') {
            console.log(`      Student ID: ${doc.studentId || 'N/A'}`);
            console.log(`      Status: ${doc.status || 'N/A'}`);
            console.log(`      Created: ${doc.createdAt || 'N/A'}`);
          } else if (collection.name === 'jobs') {
            console.log(`      Title: ${doc.title || 'N/A'}`);
            console.log(`      Employer: ${doc.employerId || 'N/A'}`);
            console.log(`      Status: ${doc.status || 'N/A'}`);
          } else {
            // Show all fields for unknown collections
            Object.keys(doc).forEach(key => {
              if (key !== '_id') {
                console.log(`      ${key}: ${doc[key] || 'N/A'}`);
              }
            });
          }
        });
        
        if (count > 3) {
          console.log(`   ... and ${count - 3} more documents`);
        }
      } else {
        console.log(`   ❌ No documents found`);
      }
    }
    
    // Specific admin data check
    console.log(`\n👥 ADMIN USERS DETAILED VIEW:`);
    console.log('-'.repeat(40));
    
    const adminUsers = await mongoose.connection.db.collection('users').find({ userType: 'admin' }).toArray();
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phone}`);
      console.log(`   User Type: ${admin.userType}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Email Verified: ${admin.emailVerified}`);
      console.log(`   Phone Verified: ${admin.phoneVerified}`);
      console.log(`   Approval Status: ${admin.approvalStatus}`);
      console.log(`   Created At: ${admin.createdAt}`);
      console.log(`   Updated At: ${admin.updatedAt}`);
    });
    
    // Admin login records
    console.log(`\n📊 ADMIN LOGIN RECORDS:`);
    console.log('-'.repeat(40));
    
    const loginRecords = await mongoose.connection.db.collection('adminlogins').find({}).sort({ loginTime: -1 }).toArray();
    console.log(`Found ${loginRecords.length} login records:`);
    
    loginRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Login Record:`);
      console.log(`   ID: ${record._id}`);
      console.log(`   Admin ID: ${record.adminId}`);
      console.log(`   Admin Email: ${record.adminEmail}`);
      console.log(`   Admin Name: ${record.adminName}`);
      console.log(`   Login Time: ${record.loginTime}`);
      console.log(`   Status: ${record.loginStatus}`);
      console.log(`   IP Address: ${record.ipAddress}`);
      console.log(`   User Agent: ${record.userAgent ? record.userAgent.substring(0, 50) + '...' : 'N/A'}`);
      if (record.failureReason) {
        console.log(`   Failure Reason: ${record.failureReason}`);
      }
      console.log(`   Created At: ${record.createdAt}`);
    });
    
    console.log(`\n🎉 MongoDB data visibility check completed!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the MongoDB visibility check
showMongoDBCollections();
