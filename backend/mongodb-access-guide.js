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

async function showMongoDBAccessMethods() {
  try {
    await connectDB();
    
    console.log('\n🔍 HOW TO ACCESS MONGODB DATA - COMPLETE GUIDE\n');
    console.log('=' .repeat(70));
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    console.log(`🔗 Connection String: ${MONGODB_URI}`);
    
    // Show collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Available Collections (${collections.length}):`);
    console.log('-'.repeat(50));
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    console.log(`\n🎯 ADMIN DATA LOCATIONS:`);
    console.log('-'.repeat(50));
    console.log(`1. 👥 Admin Users: Collection "users" (filter: userType: "admin")`);
    console.log(`2. 📊 Admin Logins: Collection "adminlogins"`);
    console.log(`3. 📋 KYC Data: Collection "kycs"`);
    console.log(`4. 💼 Jobs: Collection "jobs"`);
    console.log(`5. 🔐 OTPs: Collection "otps"`);
    
    // Show specific admin queries
    console.log(`\n🔍 SPECIFIC MONGODB QUERIES:`);
    console.log('-'.repeat(50));
    
    console.log(`\n1. Find all admin users:`);
    console.log(`   db.users.find({userType: "admin"})`);
    
    console.log(`\n2. Find admin login history:`);
    console.log(`   db.adminlogins.find().sort({loginTime: -1})`);
    
    console.log(`\n3. Find specific admin logins:`);
    console.log(`   db.adminlogins.find({adminEmail: "admin@studentjobs.com"})`);
    
    console.log(`\n4. Count admin users:`);
    console.log(`   db.users.countDocuments({userType: "admin"})`);
    
    console.log(`\n5. Find recent admin logins (last 24 hours):`);
    console.log(`   db.adminlogins.find({loginTime: {$gte: new Date(Date.now() - 24*60*60*1000)}})`);
    
    // Show current admin data
    console.log(`\n👥 CURRENT ADMIN USERS IN DATABASE:`);
    console.log('-'.repeat(50));
    
    const adminUsers = await mongoose.connection.db.collection('users').find({ userType: 'admin' }).toArray();
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📱 Phone: ${admin.phone}`);
      console.log(`   🆔 ID: ${admin._id}`);
      console.log(`   ✅ Active: ${admin.isActive}`);
      console.log(`   📧 Email Verified: ${admin.emailVerified}`);
      console.log(`   📱 Phone Verified: ${admin.phoneVerified}`);
      console.log(`   📋 Approval Status: ${admin.approvalStatus}`);
      console.log(`   📅 Created: ${admin.createdAt}`);
    });
    
    // Show recent login activity
    console.log(`\n📊 RECENT ADMIN LOGIN ACTIVITY:`);
    console.log('-'.repeat(50));
    
    const recentLogins = await mongoose.connection.db.collection('adminlogins').find({}).sort({ loginTime: -1 }).limit(5).toArray();
    recentLogins.forEach((login, index) => {
      console.log(`\n${index + 1}. ${login.adminName} (${login.adminEmail})`);
      console.log(`   🕒 Time: ${login.loginTime}`);
      console.log(`   📊 Status: ${login.loginStatus.toUpperCase()}`);
      console.log(`   🌐 IP: ${login.ipAddress}`);
      console.log(`   💻 User Agent: ${login.userAgent ? login.userAgent.substring(0, 40) + '...' : 'N/A'}`);
      if (login.failureReason) {
        console.log(`   ❌ Failure Reason: ${login.failureReason}`);
      }
    });
    
    console.log(`\n🛠️ ACCESS METHODS:`);
    console.log('-'.repeat(50));
    
    console.log(`\n1. 📱 MongoDB Compass (GUI Tool):`);
    console.log(`   - Download: https://www.mongodb.com/products/compass`);
    console.log(`   - Connect to: ${MONGODB_URI}`);
    console.log(`   - Browse collections visually`);
    console.log(`   - Run queries with GUI`);
    
    console.log(`\n2. 💻 MongoDB Shell (Command Line):`);
    console.log(`   - Install: npm install -g mongosh`);
    console.log(`   - Connect: mongosh "${MONGODB_URI}"`);
    console.log(`   - Use database: use ${dbName}`);
    console.log(`   - Show collections: show collections`);
    console.log(`   - Query data: db.users.find({userType: "admin"})`);
    
    console.log(`\n3. 🔧 Node.js Scripts (Current Method):`);
    console.log(`   - Run: node show-mongodb-data.js`);
    console.log(`   - Run: node show-complete-admin-details.js`);
    console.log(`   - Run: node check-current-admin-details.js`);
    console.log(`   - Run: node export-mongodb-data.js`);
    
    console.log(`\n4. 🌐 API Endpoints:`);
    console.log(`   - GET /api/admin/login-history`);
    console.log(`   - GET /api/admin/login-stats`);
    console.log(`   - GET /api/admin/stats`);
    
    console.log(`\n📋 QUICK REFERENCE:`);
    console.log('-'.repeat(50));
    console.log(`Database: ${dbName}`);
    console.log(`Connection: ${MONGODB_URI}`);
    console.log(`Admin Users: ${adminUsers.length}`);
    console.log(`Login Records: ${await mongoose.connection.db.collection('adminlogins').countDocuments()}`);
    console.log(`Total Collections: ${collections.length}`);
    
    console.log(`\n🎉 MongoDB access guide completed!`);
    console.log('=' .repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the access guide
showMongoDBAccessMethods();
