const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  userType: { type: String, enum: ['student', 'employer', 'admin'], default: 'student' },
  college: String,
  skills: [String],
  availability: String,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  phoneVerified: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// KYC Schema
const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: String,
  dob: Date,
  gender: String,
  phone: String,
  email: String,
  address: String,
  college: String,
  courseYear: String,
  stayType: String,
  hoursPerWeek: Number,
  availableDays: [String],
  emergencyContact: {
    name: String,
    phone: String
  },
  bloodGroup: String,
  preferredJobTypes: [String],
  experienceSkills: String,
  payroll: {
    consent: Boolean,
    bankAccount: String,
    ifsc: String,
    beneficiaryName: String
  },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  aadharCard: String,
  collegeIdCard: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const KYC = mongoose.model('KYC', kycSchema);

async function createTestStudent() {
  try {
    await connectDB();
    
    console.log('🔍 Checking for existing test student...');
    
    // Check if test student already exists
    const existingStudent = await User.findOne({ 
      email: 'student@test.com',
      userType: 'student'
    });

    if (existingStudent) {
      console.log('⚠️ Test student already exists:');
      console.log('   Email:', existingStudent.email);
      console.log('   Name:', existingStudent.name);
      console.log('   User Type:', existingStudent.userType);
      
      // Update password
      const hashedPassword = await bcrypt.hash('student123', 12);
      existingStudent.password = hashedPassword;
      existingStudent.isActive = true;
      existingStudent.emailVerified = true;
      existingStudent.approvalStatus = 'approved';
      await existingStudent.save();
      
      console.log('✅ Test student updated with correct password');
    } else {
      console.log('📝 Creating new test student...');
      
      // Create new test student
      const hashedPassword = await bcrypt.hash('student123', 12);
      const student = new User({
        name: 'Test Student',
        email: 'student@test.com',
        password: hashedPassword,
        phone: '+91 98765 43211',
        userType: 'student',
        college: 'Test University',
        skills: ['JavaScript', 'React', 'Node.js'],
        availability: 'flexible',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await student.save();
      console.log('✅ Test student created successfully!');
    }

    // Create a sample KYC for the test student
    const student = await User.findOne({ email: 'student@test.com' });
    if (student) {
      const existingKYC = await KYC.findOne({ userId: student._id });
      
      if (!existingKYC) {
        console.log('📝 Creating sample KYC for test student...');
        
        const sampleKYC = new KYC({
          userId: student._id,
          fullName: 'Test Student',
          dob: new Date('2000-01-15'),
          gender: 'male',
          phone: '+91 98765 43211',
          email: 'student@test.com',
          address: '123 Test Street, Test City, Test State 123456',
          college: 'Test University',
          courseYear: 'Computer Science - 3rd Year',
          stayType: 'home',
          hoursPerWeek: 20,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          emergencyContact: {
            name: 'Parent Test',
            phone: '+91 98765 43212'
          },
          bloodGroup: 'O+',
          preferredJobTypes: ['data-entry', 'retail'],
          experienceSkills: 'Basic computer skills, good communication',
          payroll: {
            consent: true,
            bankAccount: '1234567890',
            ifsc: 'TEST0001234',
            beneficiaryName: 'Test Student'
          },
          verificationStatus: 'pending',
          submittedAt: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await sampleKYC.save();
        console.log('✅ Sample KYC created for test student!');
      } else {
        console.log('⚠️ KYC already exists for test student');
      }
    }

    console.log('\n🎯 Test Student Login Credentials:');
    console.log('   Email: student@test.com');
    console.log('   Password: student123');
    console.log('   User Type: student');
    
    console.log('\n🔗 Student Login URL: http://localhost:3000/login');
    console.log('🔗 Admin Login URL: http://localhost:3000/admin-login');
    
    console.log('\n📋 Test Flow:');
    console.log('   1. Login as student: student@test.com / student123');
    console.log('   2. Submit/update KYC form');
    console.log('   3. Login as admin: admin@studentjobs.com / admin123456');
    console.log('   4. Review and approve/reject KYC in admin dashboard');

  } catch (error) {
    console.error('❌ Error setting up test student:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestStudent();
