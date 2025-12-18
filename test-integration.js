// Simple test to verify Django backend is working
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('Testing Django backend...');
    
    // Test basic connectivity
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '12341234'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is working!');
      console.log('Login response:', data);
    } else {
      console.log('❌ Backend error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Make sure Django server is running on port 8000');
  }
}

testBackend();