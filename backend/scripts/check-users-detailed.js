const mongoose = require('mongoose');
const User = require('../dist/models/User').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUsersDetailed() {
  try {
    console.log('🔍 Checking all users with detailed info...\n');
    
    const users = await User.find({}).select('name email userType');
    
    console.log('👥 All Users:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.userType}`);
    });
    
    const employers = users.filter(u => u.userType === 'employer');
    const students = users.filter(u => u.userType === 'student');
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Employers: ${employers.length}`);
    console.log(`   Students: ${students.length}`);
    
    if (employers.length > 0) {
      console.log(`\n✅ First employer: ${employers[0].email}`);
    }
    if (students.length > 0) {
      console.log(`✅ First student: ${students[0].email}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsersDetailed();

