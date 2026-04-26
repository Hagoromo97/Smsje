// Test if we can reach Textbelt API
console.log('🧪 Testing connection to Textbelt...\n');

async function testTextbelt() {
  const endpoints = [
    'https://textbelt.com/text',
    'https://textbelt.com/intl',
    'https://textbelt.com/canada',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    console.log('='.repeat(50));
    
    try {
      const testBody = new URLSearchParams({
        phone: '+60123456789',
        message: 'Test message',
        key: 'textbelt', // Test key
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: testBody.toString(),
      });
      
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers.get('content-type'));
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const result = await response.json();
        console.log('   Response:', JSON.stringify(result, null, 2));
        
        if (result.success !== undefined) {
          console.log('   ✅ Valid Textbelt endpoint!');
        }
      } else {
        console.log('   ❌ Not a valid JSON API endpoint (got HTML)');
      }
      
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }
  
  console.log('\n\n💡 Testing quota check endpoint...');
  try {
    const response = await fetch('https://textbelt.com/quota/textbelt');
    const result = await response.json();
    console.log('   Quota Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

testTextbelt();
