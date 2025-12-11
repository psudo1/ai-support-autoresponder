/**
 * Test connections using environment variables
 * 
 * Usage: node scripts/test-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

async function testConnections() {
  console.log('🔌 Testing Connections...\n');

  // Test Supabase Connection
  console.log('1. Testing Supabase Connection...');
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('   ❌ Missing Supabase credentials\n');
    } else {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Try to query a table (this will fail if RLS blocks it, but connection works)
      const { error } = await supabase.from('tickets').select('count').limit(1);
      
      if (error && error.code === 'PGRST301') {
        // Table doesn't exist - connection works but schema not set up
        console.log('   ⚠️  Connected but tables not found');
        console.log('   💡 Run database/schema.sql in Supabase\n');
      } else if (error && error.message.includes('row-level security')) {
        // RLS is blocking - connection works!
        console.log('   ✅ Supabase connection successful (RLS is active)\n');
      } else if (error) {
        console.log('   ❌ Connection error:', error.message, '\n');
      } else {
        console.log('   ✅ Supabase connection successful\n');
      }
    }
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message, '\n');
  }

  // Test OpenAI Connection
  console.log('2. Testing OpenAI Connection...');
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('   ❌ Missing OpenAI API key\n');
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Make a simple API call to verify the key works
      const response = await openai.models.list();
      
      if (response && response.data) {
        console.log('   ✅ OpenAI connection successful\n');
      } else {
        console.log('   ⚠️  Connected but unexpected response\n');
      }
    }
  } catch (error) {
    if (error.status === 401) {
      console.log('   ❌ Invalid API key\n');
    } else if (error.status === 429) {
      console.log('   ⚠️  Rate limit exceeded (but key is valid)\n');
    } else {
      console.log('   ❌ Connection error:', error.message, '\n');
    }
  }

  console.log('✅ Connection tests complete');
}

testConnections().catch(console.error);

