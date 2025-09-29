const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test Socket.IO connection with proper authentication
async function testSocketConnection() {
  console.log('🧪 Testing Socket.IO Connection...\n');

  // Test data
  const testUsers = [
    { email: 'sarah@techcorp.com', password: 'password123', userType: 'employer' },
    { email: 'john.student@university.edu', password: 'password123', userType: 'student' },
    { email: 'admin@studentjobs.com', password: 'admin123', userType: 'admin' }
  ];

  for (const user of testUsers) {
    console.log(`\n🔐 Testing connection for ${user.userType}: ${user.email}`);
    
    try {
      // First, get a valid token by logging in
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          userType: user.userType
        })
      });

      if (!loginResponse.ok) {
        console.log(`❌ Login failed for ${user.email}: ${loginResponse.status}`);
        continue;
      }

      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (!token) {
        console.log(`❌ No token received for ${user.email}`);
        continue;
      }

      console.log(`✅ Login successful for ${user.email}`);

      // Test Socket.IO connection
      const socket = io('http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      // Set up event handlers
      socket.on('connect', () => {
        console.log(`✅ Socket connected for ${user.email}: ${socket.id}`);
      });

      socket.on('connected', (data) => {
        console.log(`✅ Server confirmation for ${user.email}:`, data);
      });

      socket.on('connect_error', (error) => {
        console.error(`❌ Connection error for ${user.email}:`, error.message);
      });

      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${user.email}:`, error);
      });

      socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected for ${user.email}: ${reason}`);
      });

      // Test ping/pong
      socket.on('pong', (data) => {
        console.log(`🏓 Pong received for ${user.email}:`, data);
      });

      // Send ping after connection
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('ping');
          console.log(`🏓 Ping sent for ${user.email}`);
        }
      }, 2000);

      // Test job room joining
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('join_job_room', 'test-job-id');
          console.log(`🔌 Joined job room for ${user.email}`);
        }
      }, 3000);

      // Disconnect after 5 seconds
      setTimeout(() => {
        socket.disconnect();
        console.log(`🔌 Disconnected ${user.email} after test`);
      }, 5000);

    } catch (error) {
      console.error(`❌ Test failed for ${user.email}:`, error.message);
    }
  }

  // Wait for all tests to complete
  setTimeout(() => {
    console.log('\n✅ Socket.IO connection tests completed');
    process.exit(0);
  }, 10000);
}

// Run the test
testSocketConnection().catch(console.error);
