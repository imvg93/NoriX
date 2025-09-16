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

async function findKYCDetails() {
  try {
    await connectDB();
    
    console.log('\n🔍 FINDING KYC DETAILS OF SUBMITTED STUDENTS\n');
    console.log('=' .repeat(60));
    
    // 1. Check KYC collection
    console.log('📋 KYC Collection Analysis:');
    console.log('-'.repeat(40));
    
    const kycCollection = mongoose.connection.db.collection('kycs');
    const kycCount = await kycCollection.countDocuments();
    console.log(`Total KYC Records: ${kycCount}`);
    
    if (kycCount > 0) {
      const allKYC = await kycCollection.find({}).toArray();
      console.log(`\n📄 All KYC Records:`);
      
      allKYC.forEach((kyc, index) => {
        console.log(`\n${index + 1}. KYC Record:`);
        console.log(`   ID: ${kyc._id}`);
        console.log(`   Student ID: ${kyc.studentId || 'N/A'}`);
        console.log(`   Status: ${kyc.status || 'N/A'}`);
        console.log(`   Created: ${kyc.createdAt || 'N/A'}`);
        console.log(`   Updated: ${kyc.updatedAt || 'N/A'}`);
        
        // Show all fields
        console.log(`   All Fields:`);
        Object.keys(kyc).forEach(key => {
          if (key !== '_id') {
            console.log(`      ${key}: ${kyc[key] || 'N/A'}`);
          }
        });
      });
    } else {
      console.log('❌ No KYC records found in the database');
    }
    
    // 2. Check Users collection for students
    console.log(`\n👥 Student Users Analysis:`);
    console.log('-'.repeat(40));
    
    const usersCollection = mongoose.connection.db.collection('users');
    const studentCount = await usersCollection.countDocuments({ userType: 'student' });
    console.log(`Total Student Users: ${studentCount}`);
    
    if (studentCount > 0) {
      const students = await usersCollection.find({ userType: 'student' }).toArray();
      console.log(`\n📄 All Student Users:`);
      
      students.forEach((student, index) => {
        console.log(`\n${index + 1}. Student:`);
        console.log(`   ID: ${student._id}`);
        console.log(`   Name: ${student.name || 'N/A'}`);
        console.log(`   Email: ${student.email || 'N/A'}`);
        console.log(`   Phone: ${student.phone || 'N/A'}`);
        console.log(`   College: ${student.college || 'N/A'}`);
        console.log(`   Skills: ${student.skills ? student.skills.join(', ') : 'N/A'}`);
        console.log(`   Active: ${student.isActive || 'N/A'}`);
        console.log(`   Email Verified: ${student.emailVerified || 'N/A'}`);
        console.log(`   Phone Verified: ${student.phoneVerified || 'N/A'}`);
        console.log(`   Approval Status: ${student.approvalStatus || 'N/A'}`);
        console.log(`   Created: ${student.createdAt || 'N/A'}`);
      });
    }
    
    // 3. Check if there are any KYC-related fields in users
    console.log(`\n🔍 Checking for KYC fields in User documents:`);
    console.log('-'.repeat(40));
    
    const usersWithKYCFields = await usersCollection.find({
      $or: [
        { kycStatus: { $exists: true } },
        { kycSubmitted: { $exists: true } },
        { kycData: { $exists: true } },
        { documents: { $exists: true } },
        { profilePicture: { $exists: true } },
        { cloudinaryPublicId: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Users with KYC-related fields: ${usersWithKYCFields.length}`);
    
    usersWithKYCFields.forEach((user, index) => {
      console.log(`\n${index + 1}. User with KYC fields:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User Type: ${user.userType}`);
      
      // Show KYC-related fields
      const kycFields = ['kycStatus', 'kycSubmitted', 'kycData', 'documents', 'profilePicture', 'cloudinaryPublicId'];
      kycFields.forEach(field => {
        if (user[field] !== undefined) {
          console.log(`   ${field}: ${user[field] || 'N/A'}`);
        }
      });
    });
    
    // 4. Check for any other collections that might contain KYC data
    console.log(`\n📁 Checking all collections for KYC-related data:`);
    console.log('-'.repeat(40));
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      
      if (count > 0) {
        // Check if collection might contain KYC data
        const sampleDoc = await mongoose.connection.db.collection(collectionName).findOne({});
        const hasKYCFields = sampleDoc && Object.keys(sampleDoc).some(key => 
          key.toLowerCase().includes('kyc') || 
          key.toLowerCase().includes('document') ||
          key.toLowerCase().includes('verification') ||
          key.toLowerCase().includes('profile')
        );
        
        if (hasKYCFields) {
          console.log(`\n📋 Collection "${collectionName}" (${count} docs) - Contains KYC-related fields:`);
          const kycDocs = await mongoose.connection.db.collection(collectionName).find({}).limit(3).toArray();
          
          kycDocs.forEach((doc, index) => {
            console.log(`   ${index + 1}. Document ID: ${doc._id}`);
            Object.keys(doc).forEach(key => {
              if (key.toLowerCase().includes('kyc') || 
                  key.toLowerCase().includes('document') ||
                  key.toLowerCase().includes('verification') ||
                  key.toLowerCase().includes('profile')) {
                console.log(`      ${key}: ${doc[key] || 'N/A'}`);
              }
            });
          });
        }
      }
    }
    
    // 5. Check backend KYC model structure
    console.log(`\n🏗️ Expected KYC Model Structure:`);
    console.log('-'.repeat(40));
    console.log(`Based on the backend code, KYC should contain:`);
    console.log(`- studentId (ObjectId reference to User)`);
    console.log(`- status (pending, approved, rejected)`);
    console.log(`- documents (array of document objects)`);
    console.log(`- submittedAt (Date)`);
    console.log(`- reviewedAt (Date)`);
    console.log(`- reviewedBy (ObjectId reference to Admin)`);
    console.log(`- rejectionReason (String)`);
    console.log(`- createdAt, updatedAt (timestamps)`);
    
    // 6. Show MongoDB queries to find KYC data
    console.log(`\n🔍 MongoDB Queries to Find KYC Data:`);
    console.log('-'.repeat(40));
    console.log(`1. Find all KYC records:`);
    console.log(`   db.kycs.find()`);
    console.log(`\n2. Find KYC by status:`);
    console.log(`   db.kycs.find({status: "pending"})`);
    console.log(`\n3. Find KYC with student details:`);
    console.log(`   db.kycs.aggregate([{$lookup: {from: "users", localField: "studentId", foreignField: "_id", as: "student"}}])`);
    console.log(`\n4. Find students with KYC data:`);
    console.log(`   db.users.find({userType: "student", kycStatus: {$exists: true}})`);
    
    console.log(`\n🎉 KYC details search completed!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the KYC search
findKYCDetails();
