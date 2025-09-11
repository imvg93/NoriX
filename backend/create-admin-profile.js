const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// User Schema (matching the actual backend schema)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  userType: { type: String, enum: ['student', 'employer', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  phoneVerified: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createAdminProfile() {
  try {
    await connectDB();
    
    console.log('🔧 Admin Profile Creation Tool');
    console.log('================================\n');
    
    // Get admin details from user
    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');
    const phone = await askQuestion('Enter admin phone (e.g., +91 98765 43210): ');
    const password = await askQuestion('Enter admin password (min 6 characters): ');
    
    // Validate inputs
    if (!name || !email || !phone || !password) {
      console.log('❌ All fields are required!');
      return;
    }
    
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long!');
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️ User with email ${email} already exists!`);
      const update = await askQuestion('Do you want to update this user to admin? (y/n): ');
      
      if (update.toLowerCase() === 'y' || update.toLowerCase() === 'yes') {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(password, 12);
        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.phone = phone;
        existingUser.userType = 'admin';
        existingUser.isActive = true;
        existingUser.emailVerified = true;
        existingUser.approvalStatus = 'approved';
        existingUser.updatedAt = new Date();
        
        await existingUser.save();
        console.log('✅ Existing user updated to admin successfully!');
      } else {
        console.log('❌ Operation cancelled.');
        return;
      }
    } else {
      // Create new admin user
      console.log('\n📝 Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = new User({
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone,
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await admin.save();
      console.log('✅ New admin user created successfully!');
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log('   Name:', name);
    console.log('   Email:', email.toLowerCase());
    console.log('   Password:', password);
    console.log('   User Type: admin');
    
    console.log('\n🔗 Login URL: http://localhost:3000/admin-login');
    
    // Test the login
    console.log('\n🧪 Testing admin login...');
    const testAdmin = await User.findOne({ email: email.toLowerCase() });
    if (testAdmin) {
      const passwordMatch = await bcrypt.compare(password, testAdmin.password);
      if (passwordMatch) {
        console.log('✅ Password verification successful!');
        console.log('✅ Admin user is ready for login!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('   1. Make sure backend server is running: npm run dev');
    console.log('   2. Make sure frontend server is running: npm run dev');
    console.log('   3. Go to: http://localhost:3000/admin-login');
    console.log('   4. Use the credentials above to login');

  } catch (error) {
    console.error('❌ Error creating admin profile:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdminProfile();
