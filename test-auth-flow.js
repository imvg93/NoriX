const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
    console.log('🧪 Testing Authentication Flow...\n');
    
    try {
        // Test 1: Login with existing user
        console.log('1️⃣ Testing login with john.student@university.edu...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'john.student@university.edu',
                password: 'password123', // Default password
                userType: 'student'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', loginData);
        
        if (!loginData.success) {
            console.log('❌ Login failed:', loginData.message);
            return;
        }
        
        const token = loginData.token;
        console.log('✅ Login successful! Token:', token.substring(0, 20) + '...\n');
        
        // Test 2: Test KYC profile save with token
        console.log('2️⃣ Testing KYC profile save...');
        const kycData = {
            fullName: 'John Student',
            dob: '2000-01-01',
            phone: '+1234567890',
            email: 'john.student@university.edu',
            address: '123 University Street, Tech City',
            college: 'University of Technology',
            courseYear: 'B.Tech 3rd Year',
            stayType: 'home',
            hoursPerWeek: 20,
            availableDays: ['monday', 'tuesday', 'wednesday'],
            emergencyContact: {
                name: 'Emergency Contact',
                phone: '+1234567890'
            }
        };
        
        const kycResponse = await fetch(`${API_BASE_URL}/kyc/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(kycData)
        });
        
        const kycResult = await kycResponse.json();
        console.log('KYC Response:', kycResult);
        
        if (kycResult.success) {
            console.log('✅ KYC profile saved successfully!');
        } else {
            console.log('❌ KYC save failed:', kycResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAuthentication();
