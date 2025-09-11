const mongoose = require('mongoose');
const fs = require('fs');

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

async function exportMongoDBData() {
  try {
    await connectDB();
    
    console.log('\n📊 EXPORTING MONGODB DATA TO READABLE FORMAT\n');
    console.log('=' .repeat(60));
    
    const exportData = {
      database: mongoose.connection.db.databaseName,
      timestamp: new Date().toISOString(),
      collections: {}
    };
    
    // Export Users Collection
    console.log('📋 Exporting Users Collection...');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    exportData.collections.users = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      approvalStatus: user.approvalStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    console.log(`   ✅ Exported ${users.length} users`);
    
    // Export Admin Logins Collection
    console.log('📋 Exporting Admin Logins Collection...');
    const adminLogins = await mongoose.connection.db.collection('adminlogins').find({}).sort({ loginTime: -1 }).toArray();
    exportData.collections.adminlogins = adminLogins.map(login => ({
      _id: login._id.toString(),
      adminId: login.adminId.toString(),
      adminEmail: login.adminEmail,
      adminName: login.adminName,
      loginTime: login.loginTime,
      ipAddress: login.ipAddress,
      userAgent: login.userAgent,
      loginStatus: login.loginStatus,
      failureReason: login.failureReason,
      sessionDuration: login.sessionDuration,
      logoutTime: login.logoutTime,
      createdAt: login.createdAt,
      updatedAt: login.updatedAt
    }));
    console.log(`   ✅ Exported ${adminLogins.length} admin login records`);
    
    // Export KYC Collection
    console.log('📋 Exporting KYC Collection...');
    const kycs = await mongoose.connection.db.collection('kycs').find({}).toArray();
    exportData.collections.kycs = kycs.map(kyc => ({
      _id: kyc._id.toString(),
      studentId: kyc.studentId?.toString(),
      status: kyc.status,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt
    }));
    console.log(`   ✅ Exported ${kycs.length} KYC records`);
    
    // Export Jobs Collection
    console.log('📋 Exporting Jobs Collection...');
    const jobs = await mongoose.connection.db.collection('jobs').find({}).toArray();
    exportData.collections.jobs = jobs.map(job => ({
      _id: job._id.toString(),
      title: job.title,
      employerId: job.employerId?.toString(),
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }));
    console.log(`   ✅ Exported ${jobs.length} job records`);
    
    // Export OTP Collection
    console.log('📋 Exporting OTP Collection...');
    const otps = await mongoose.connection.db.collection('otps').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    exportData.collections.otps = otps.map(otp => ({
      _id: otp._id.toString(),
      email: otp.email,
      otp: otp.otp,
      purpose: otp.purpose,
      expiresAt: otp.expiresAt,
      createdAt: otp.createdAt,
      updatedAt: otp.updatedAt
    }));
    console.log(`   ✅ Exported ${otps.length} OTP records (latest 10)`);
    
    // Write to JSON file
    const filename = `mongodb-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data exported to: ${filename}`);
    
    // Create a summary report
    const summaryReport = `
# MongoDB Data Export Summary
Generated: ${new Date().toLocaleString()}

## Database: ${exportData.database}

## Collections Summary:
- **Users**: ${exportData.collections.users.length} records
- **Admin Logins**: ${exportData.collections.adminlogins.length} records  
- **KYC**: ${exportData.collections.kycs.length} records
- **Jobs**: ${exportData.collections.jobs.length} records
- **OTPs**: ${exportData.collections.otps.length} records (latest 10)

## Admin Users:
${exportData.collections.users.filter(user => user.userType === 'admin').map(admin => `
- **${admin.name}** (${admin.email})
  - Phone: ${admin.phone}
  - Active: ${admin.isActive}
  - Email Verified: ${admin.emailVerified}
  - Phone Verified: ${admin.phoneVerified}
  - Approval Status: ${admin.approvalStatus}
  - Created: ${admin.createdAt}`).join('')}

## Recent Admin Login Activity:
${exportData.collections.adminlogins.slice(0, 5).map(login => `
- **${login.adminName}** (${login.adminEmail})
  - Time: ${login.loginTime}
  - Status: ${login.loginStatus}
  - IP: ${login.ipAddress}
  - User Agent: ${login.userAgent ? login.userAgent.substring(0, 50) + '...' : 'N/A'}`).join('')}

## MongoDB Connection Details:
- **Database**: ${exportData.database}
- **Connection String**: ${MONGODB_URI}
- **Collections**: ${Object.keys(exportData.collections).join(', ')}

## How to Access MongoDB Data:

### 1. Using MongoDB Compass (GUI):
1. Download MongoDB Compass from: https://www.mongodb.com/products/compass
2. Connect using: ${MONGODB_URI}
3. Browse collections: users, adminlogins, kycs, jobs, otps

### 2. Using MongoDB Shell:
\`\`\`bash
mongosh "${MONGODB_URI}"
use studentjobs
show collections
db.users.find({userType: "admin"})
db.adminlogins.find().sort({loginTime: -1})
\`\`\`

### 3. Using Node.js Scripts:
Run any of these scripts in the backend directory:
- \`node show-mongodb-data.js\` - View all collections
- \`node show-complete-admin-details.js\` - Detailed admin info
- \`node check-current-admin-details.js\` - Admin summary

## Admin Login Credentials:
${exportData.collections.users.filter(user => user.userType === 'admin').map(admin => `
- **Email**: ${admin.email}
- **Password**: admin123456
- **User Type**: admin`).join('')}
`;
    
    fs.writeFileSync('mongodb-summary-report.md', summaryReport);
    console.log(`📄 Summary report created: mongodb-summary-report.md`);
    
    console.log(`\n🎉 MongoDB data export completed successfully!`);
    console.log('=' .repeat(60));
    
    // Show quick access commands
    console.log(`\n🔗 Quick Access Commands:`);
    console.log(`   MongoDB Compass: Connect to ${MONGODB_URI}`);
    console.log(`   MongoDB Shell: mongosh "${MONGODB_URI}"`);
    console.log(`   View Data: node show-mongodb-data.js`);
    console.log(`   Admin Details: node show-complete-admin-details.js`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the export
exportMongoDBData();
