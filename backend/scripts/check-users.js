const mongoose = require('mongoose');
const User = require('../dist/models/User').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...\n');
    
    const employers = await User.find({ userType: 'employer' }).select('name email');
    const students = await User.find({ userType: 'student' }).select('name email');
    
    console.log('👔 Employers:');
    employers.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.name} (${emp.email})`);
    });
    
    console.log('\n🎓 Students:');
    students.forEach((stu, index) => {
      console.log(`   ${index + 1}. ${stu.name} (${stu.email})`);
    });
    
    if (employers.length > 0 && students.length > 0) {
      console.log('\n✅ Found users for testing:');
      console.log(`   Employer: ${employers[0].email}`);
      console.log(`   Student: ${students[0].email}`);
    } else {
      console.log('\n❌ No users found for testing');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();

