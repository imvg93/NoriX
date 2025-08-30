import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@studentjobs.com',
      password: adminPassword,
      phone: '+91 98765 43210',
      role: 'admin',
      status: 'active',
      isVerified: true,
      verificationDate: new Date()
    });

    // Create sample employer
    const employerPassword = await bcrypt.hash('employer123', 12);
    const employer = await User.create({
      name: 'TechCorp Solutions',
      email: 'hr@techcorp.com',
      password: employerPassword,
      phone: '+91 98765 43210',
      role: 'employer',
      status: 'active',
      isVerified: true,
      verificationDate: new Date(),
      company: 'TechCorp Solutions',
      industry: 'Technology',
      companySize: '50-100 employees',
      companyLocation: 'Hyderabad, Telangana',
      companyDescription: 'Leading technology solutions provider specializing in web and mobile applications.'
    });

    // Create sample student
    const studentPassword = await bcrypt.hash('student123', 12);
    const student = await User.create({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: studentPassword,
      phone: '+91 98765 43210',
      role: 'student',
      status: 'active',
      isVerified: true,
      verificationDate: new Date(),
      college: 'B.Tech Computer Science',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      experience: '1 year',
      availability: 'weekdays'
    });

    console.log('👥 Created sample users');

    // Create sample jobs
    const job1 = await Job.create({
      title: 'Frontend Developer Intern',
      description: 'We are looking for a talented frontend developer intern to join our team.',
      requirements: ['React', 'JavaScript', 'HTML', 'CSS', 'Basic understanding of web development'],
      location: 'Hyderabad',
      type: 'Internship',
      category: 'Technology',
      salary: 15000,
      benefits: ['Flexible hours', 'Learning opportunities', 'Certificate'],
      schedule: 'Monday to Friday, 4 hours/day',
      startDate: new Date('2024-02-01'),
      employer: employer._id,
      status: 'active',
      views: 45,
      applications: 12
    });

    const job2 = await Job.create({
      title: 'React Developer',
      description: 'Join our dynamic team as a React developer for exciting projects.',
      requirements: ['React', 'Node.js', 'TypeScript', '2+ years experience'],
      location: 'Hyderabad',
      type: 'Part-time',
      category: 'Technology',
      salary: 25000,
      benefits: ['Remote work', 'Competitive salary', 'Growth opportunities'],
      schedule: 'Flexible hours, 20 hours/week',
      startDate: new Date('2024-02-15'),
      employer: employer._id,
      status: 'active',
      views: 32,
      applications: 8
    });

    const job3 = await Job.create({
      title: 'Backend Developer',
      description: 'Looking for a skilled backend developer to work on server-side applications.',
      requirements: ['Node.js', 'MongoDB', 'Express.js', '3+ years experience'],
      location: 'Hyderabad',
      type: 'Full-time',
      category: 'Technology',
      salary: 40000,
      benefits: ['Health insurance', 'Paid time off', 'Professional development'],
      schedule: 'Monday to Friday, 8 hours/day',
      startDate: new Date('2024-03-01'),
      employer: employer._id,
      status: 'pending',
      views: 67,
      applications: 15
    });

    console.log('💼 Created sample jobs');

    // Create sample applications
    await Application.create({
      job: job1._id,
      student: student._id,
      coverLetter: 'I am excited to apply for this position. I have experience with React and would love to learn more.',
      resume: 'resume_john_doe.pdf',
      status: 'shortlisted',
      appliedDate: new Date('2024-01-15')
    });

    await Application.create({
      job: job2._id,
      student: student._id,
      coverLetter: 'I believe my skills and experience make me a great fit for this role.',
      resume: 'resume_john_doe.pdf',
      status: 'pending',
      appliedDate: new Date('2024-01-14')
    });

    console.log('📝 Created sample applications');

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log(`- Admin: admin@studentjobs.com / admin123456`);
    console.log(`- Employer: hr@techcorp.com / employer123`);
    console.log(`- Student: john.doe@email.com / student123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await disconnectDB();
  }
};

// Run the seed function
seedData();

