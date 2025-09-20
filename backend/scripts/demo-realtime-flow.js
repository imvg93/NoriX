const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Example real-time event flow for job approval and student application
async function demonstrateRealTimeFlow() {
  console.log('🎭 Demonstrating Real-time Event Flow...\n');

  // Step 1: Admin connects and approves a job
  console.log('1️⃣ Admin connecting and approving job...');
  
  try {
    // Admin login
    const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123',
        userType: 'admin'
      })
    });

    const adminData = await adminLogin.json();
    const adminToken = adminData.token;

    // Admin socket connection
    const adminSocket = io('http://localhost:5000', {
      auth: { token: adminToken },
      transports: ['websocket']
    });

    adminSocket.on('connect', () => {
      console.log('✅ Admin connected:', adminSocket.id);
    });

    adminSocket.on('connected', (data) => {
      console.log('✅ Admin server confirmation:', data);
    });

    // Step 2: Student connects
    console.log('\n2️⃣ Student connecting...');
    
    const studentLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'password123',
        userType: 'student'
      })
    });

    const studentData = await studentLogin.json();
    const studentToken = studentData.token;

    const studentSocket = io('http://localhost:5000', {
      auth: { token: studentToken },
      transports: ['websocket']
    });

    studentSocket.on('connect', () => {
      console.log('✅ Student connected:', studentSocket.id);
    });

    studentSocket.on('connected', (data) => {
      console.log('✅ Student server confirmation:', data);
    });

    // Student listens for job approvals
    studentSocket.on('job_approved', (data) => {
      console.log('🎉 Student received job approval notification:', data);
    });

    // Step 3: Employer connects
    console.log('\n3️⃣ Employer connecting...');
    
    const employerLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@techcorp.com',
        password: 'password123',
        userType: 'employer'
      })
    });

    const employerData = await employerLogin.json();
    const employerToken = employerData.token;

    const employerSocket = io('http://localhost:5000', {
      auth: { token: employerToken },
      transports: ['websocket']
    });

    employerSocket.on('connect', () => {
      console.log('✅ Employer connected:', employerSocket.id);
    });

    employerSocket.on('connected', (data) => {
      console.log('✅ Employer server confirmation:', data);
    });

    // Employer listens for new applications
    employerSocket.on('new_application', (data) => {
      console.log('📝 Employer received new application notification:', data);
    });

    // Step 4: Simulate job approval (this would normally come from admin panel)
    console.log('\n4️⃣ Simulating job approval...');
    
    setTimeout(async () => {
      try {
        // Get a job to approve
        const jobsResponse = await fetch('http://localhost:5000/api/jobs/admin', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const jobsData = await jobsResponse.json();
        
        if (jobsData.jobs && jobsData.jobs.length > 0) {
          const jobToApprove = jobsData.jobs[0];
          console.log(`📋 Approving job: ${jobToApprove.jobTitle}`);
          
          // Approve the job
          const approveResponse = await fetch(`http://localhost:5000/api/jobs/${jobToApprove._id}/approve`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          
          if (approveResponse.ok) {
            console.log('✅ Job approved successfully');
            // The server should emit 'job_approved' event to all students
          } else {
            console.log('❌ Job approval failed');
          }
        } else {
          console.log('⚠️ No jobs found to approve');
        }
      } catch (error) {
        console.error('❌ Error approving job:', error);
      }
    }, 3000);

    // Step 5: Simulate student application
    console.log('\n5️⃣ Simulating student application...');
    
    setTimeout(async () => {
      try {
        // Get approved jobs
        const jobsResponse = await fetch('http://localhost:5000/api/jobs', {
          headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const jobsData = await jobsResponse.json();
        
        if (jobsData.jobs && jobsData.jobs.length > 0) {
          const jobToApply = jobsData.jobs[0];
          console.log(`📝 Applying to job: ${jobToApply.jobTitle}`);
          
          // Apply to the job
          const applyResponse = await fetch('http://localhost:5000/api/applications', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${studentToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jobId: jobToApply._id,
              coverLetter: 'I am very interested in this position.',
              expectedPay: 50000,
              availability: 'Immediate'
            })
          });
          
          if (applyResponse.ok) {
            console.log('✅ Application submitted successfully');
            // The server should emit 'new_application' event to the employer
          } else {
            console.log('❌ Application submission failed');
          }
        } else {
          console.log('⚠️ No approved jobs found to apply to');
        }
      } catch (error) {
        console.error('❌ Error submitting application:', error);
      }
    }, 5000);

    // Clean up after demonstration
    setTimeout(() => {
      console.log('\n🧹 Cleaning up connections...');
      adminSocket.disconnect();
      studentSocket.disconnect();
      employerSocket.disconnect();
      console.log('✅ Real-time flow demonstration completed');
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateRealTimeFlow().catch(console.error);


