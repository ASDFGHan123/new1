// Test environment variables and API connection
export const testEnvironmentAndAPI = async () => {
  console.log('=== Environment Variables ===');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_USE_REAL_DATA:', import.meta.env.VITE_USE_REAL_DATA);
  
  console.log('=== Testing Direct API Call ===');
  try {
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
    } else {
      const errorText = await response.text();
      console.log('Login failed:', errorText);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Call this in browser console or component
// testEnvironmentAndAPI();