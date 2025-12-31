/**
 * Frontend API Test
 * Run this in browser console to test signin
 */

async function testLanSignin() {
  console.log('='.repeat(50));
  console.log('  OffChat LAN Signin Frontend Test');
  console.log('='.repeat(50));
  
  // Test 1: Check API URL
  console.log('\n[TEST 1] Checking API URL...');
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const expectedApiUrl = `${protocol}//${hostname}:8000/api`;
  console.log(`  Hostname: ${hostname}`);
  console.log(`  Protocol: ${protocol}`);
  console.log(`  Expected API URL: ${expectedApiUrl}`);
  console.log('[PASS] API URL detected');
  
  // Test 2: Test login endpoint
  console.log('\n[TEST 2] Testing login endpoint...');
  try {
    const response = await fetch(`${expectedApiUrl}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '12341234'
      })
    });
    
    const data = await response.json();
    console.log('  Response status:', response.status);
    console.log('  Response data:', data);
    
    if (response.ok && data.tokens) {
      console.log('[PASS] Login endpoint working');
      console.log('  Access token received:', data.tokens.access ? 'Yes' : 'No');
      console.log('  Refresh token received:', data.tokens.refresh ? 'Yes' : 'No');
      console.log('  User data:', data.user);
      return true;
    } else if (response.ok && data.access) {
      console.log('[PASS] Login endpoint working (alternate format)');
      console.log('  Access token received: Yes');
      console.log('  Refresh token received:', data.refresh ? 'Yes' : 'No');
      return true;
    } else {
      console.log('[FAIL] Login failed:', data.error || data.detail);
      return false;
    }
  } catch (error) {
    console.log('[FAIL] Network error:', error.message);
    return false;
  }
}

// Run the test
testLanSignin().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('  ✓ Frontend can connect to backend!');
    console.log('  Signin should work now.');
  } else {
    console.log('  ✗ Frontend cannot connect to backend');
    console.log('  Check:');
    console.log('    1. Backend is running on port 8000');
    console.log('    2. Firewall allows port 8000');
    console.log('    3. You are on the same network');
  }
  console.log('='.repeat(50));
});
