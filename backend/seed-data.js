const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// Sample data
const sampleUsers = [
  {
    name: 'John Student',
    email: 'john.student@university.edu',
    phone: '+1234567890',
    password: 'password123',
    userType: 'student',
    college: 'University of Technology',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    availability: 'weekdays',
    rating: 4.5,
    completedJobs: 8,
    totalEarnings: 1200,
    emailVerified: true,
    phoneVerified: false,
    isActive: true,
    approvalStatus: 'approved'
  },
  {
    name: 'Sarah Employer',
    email: 'sarah@techcorp.com',
    phone: '+1987654321',
    password: 'password123',
    userType: 'employer',
    companyName: 'TechCorp Solutions',
    businessType: 'Tech Company',
    address: '123 Business Ave, Tech City, TC 12345',
    isVerified: true,
    emailVerified: true,
    phoneVerified: true,
    isActive: true,
    approvalStatus: 'approved'
  },
  {
    name: 'Mike Admin',
    email: 'admin@studentjobs.com',
    phone: '+1555555555',
    password: 'admin123',
    userType: 'admin',
    emailVerified: true,
    phoneVerified: true,
    isActive: true,
    approvalStatus: 'approved'
  }
];

const sampleJobs = [
  {
    title: 'Web Developer Intern',
    description: 'We are looking for a skilled web developer intern to join our team. You will work on real projects and learn modern web technologies.',
    requirements: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    location: 'New York, NY',
    salary: 25,
    jobType: 'part-time',
    status: 'active',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    title: 'Data Entry Specialist',
    description: 'Looking for a detail-oriented individual to help with data entry tasks. Perfect for students looking for flexible work.',
    requirements: ['Microsoft Excel', 'Attention to Detail', 'Fast Typing'],
    location: 'Remote',
    salary: 18,
    jobType: 'part-time',
    status: 'active',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
  },
  {
    title: 'Customer Service Representative',
    description: 'Join our customer service team and help customers with their inquiries. Great communication skills required.',
    requirements: ['Communication Skills', 'Patience', 'Problem Solving'],
    location: 'Los Angeles, CA',
    salary: 20,
    jobType: 'part-time',
    status: 'active',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const jobsCollection = db.collection('jobs');
    
    // Clear existing data (optional)
    console.log('🧹 Clearing existing data...');
    await usersCollection.deleteMany({});
    await jobsCollection.deleteMany({});
    
    // Hash passwords and insert users
    console.log('👥 Creating sample users...');
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12),
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    
    const userResults = await usersCollection.insertMany(hashedUsers);
    console.log(`✅ Created ${userResults.insertedCount} users`);
    
    // Insert jobs (with employer reference)
    console.log('💼 Creating sample jobs...');
    const employerUser = userResults.insertedIds[1]; // Sarah Employer
    const jobsWithEmployer = sampleJobs.map(job => ({
      ...job,
      employer: employerUser,
      applications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const jobResults = await jobsCollection.insertMany(jobsWithEmployer);
    console.log(`✅ Created ${jobResults.insertedCount} jobs`);
    
    // Show final counts
    const finalUserCount = await usersCollection.countDocuments();
    const finalJobCount = await jobsCollection.countDocuments();
    
    console.log('\n📊 Final Database Status:');
    console.log(`  - Users: ${finalUserCount}`);
    console.log(`  - Jobs: ${finalJobCount}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Sample Login Credentials:');
    console.log('  Student: john.student@university.edu / password123');
    console.log('  Employer: sarah@techcorp.com / password123');
    console.log('  Admin: admin@studentjobs.com / admin123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

seedDatabase();
