const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function showUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Define User schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      userType: String,
      createdAt: Date,
      college: String,
      companyName: String,
      isActive: Boolean,
      emailVerified: Boolean
    });

    const User = mongoose.model('User', userSchema);

    // Get all users
    const users = await User.find({}).select('name email phone userType createdAt college companyName isActive emailVerified -_id');
    
    console.log('\n📊 REGISTERED USERS:');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in the database!');
    } else {
      console.log(`✅ Found ${users.length} registered user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name || 'N/A'}`);
        console.log(`   📧 Email: ${user.email || 'N/A'}`);
        console.log(`   📱 Phone: ${user.phone || 'N/A'}`);
        console.log(`   👤 Type: ${user.userType || 'N/A'}`);
        console.log(`   📅 Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}`);
        console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   📧 Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        
        if (user.userType === 'student' && user.college) {
          console.log(`   🎓 College: ${user.college}`);
        }
        if (user.userType === 'employer' && user.companyName) {
          console.log(`   🏢 Company: ${user.companyName}`);
        }
        console.log('-'.repeat(50));
      });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ userType: 'student' });
    const employers = await User.countDocuments({ userType: 'employer' });
    const admins = await User.countDocuments({ userType: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedEmails = await User.countDocuments({ emailVerified: true });

    console.log('\n📈 USER STATISTICS:');
    console.log('='.repeat(30));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Students: ${students}`);
    console.log(`Employers: ${employers}`);
    console.log(`Admins: ${admins}`);
    console.log(`Active Users: ${activeUsers}`);
    console.log(`Email Verified: ${verifiedEmails}`);

    // Show email list
    console.log('\n📧 EMAIL LIST:');
    console.log('='.repeat(30));
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.userType})`);
      });
    } else {
      console.log('No emails found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

showUsers();
