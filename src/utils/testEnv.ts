// Test environment variables and API connection
import { API_BASE_URL, apiService } from "@/lib/api";

export const testEnvironmentAndAPI = async (username: string, password: string) => {
  console.log('=== Environment Variables ===');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_USE_REAL_DATA:', import.meta.env.VITE_USE_REAL_DATA);
  console.log('API_BASE_URL:', API_BASE_URL);
  
  console.log('=== Testing Direct API Call ===');
  try {
    const response = await apiService.login({ username, password });
    console.log('Login response:', response);
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Call this in browser console or component
// testEnvironmentAndAPI();