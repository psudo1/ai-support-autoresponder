/**
 * Simple Environment Variables Verifier
 * 
 * Usage: node scripts/verify-env.js
 */

require('dotenv').config({ path: '.env.local' });

const required = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    check: (val) => val && (val.startsWith('https://') || val.includes('supabase')),
    hint: 'Should be your Supabase project URL (https://xxx.supabase.co)'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    check: (val) => val && val.length > 50 && val.startsWith('eyJ'),
    hint: 'Should be your Supabase anon/public key (starts with eyJ)'
  },
  'SUPABASE_SERVICE_KEY': {
    check: (val) => val && val.length > 50 && val.startsWith('eyJ'),
    hint: 'Should be your Supabase service_role key (starts with eyJ)'
  },
  'OPENAI_API_KEY': {
    check: (val) => val && val.startsWith('sk-'),
    hint: 'Should be your OpenAI API key (starts with sk-)'
  }
};

const optional = {
  'NEXT_PUBLIC_APP_URL': {
    check: (val) => !val || val.startsWith('http'),
    hint: 'Optional: Application URL (defaults to http://localhost:3000)'
  }
};

console.log('🔍 Verifying Environment Variables\n');
console.log('='.repeat(60));

let allValid = true;

// Check required variables
console.log('\n📋 Required Variables:\n');
for (const [key, { check, hint }] of Object.entries(required)) {
  const value = process.env[key];
  const isValid = value && check(value);
  
  if (isValid) {
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`✅ ${key}`);
    console.log(`   ${masked}`);
  } else {
    console.log(`❌ ${key}`);
    console.log(`   ${hint}`);
    allValid = false;
  }
  console.log('');
}

// Check optional variables
console.log('\n📋 Optional Variables:\n');
for (const [key, { check, hint }] of Object.entries(optional)) {
  const value = process.env[key];
  if (value) {
    const isValid = check(value);
    if (isValid) {
      console.log(`✅ ${key} (set)`);
    } else {
      console.log(`⚠️  ${key} (invalid format)`);
      console.log(`   ${hint}`);
    }
  } else {
    console.log(`ℹ️  ${key} (not set - using default)`);
  }
  console.log('');
}

console.log('='.repeat(60));

if (allValid) {
  console.log('\n✅ All required environment variables are set correctly!\n');
  console.log('💡 Next steps:');
  console.log('   1. Run database schema: database/schema.sql in Supabase');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Visit: http://localhost:3000/dashboard\n');
  process.exit(0);
} else {
  console.log('\n❌ Some required variables are missing or invalid!\n');
  console.log('💡 To fix:');
  console.log('   1. Create .env.local in the project root');
  console.log('   2. Add the missing variables');
  console.log('   3. Get Supabase credentials: https://app.supabase.com → Settings → API');
  console.log('   4. Get OpenAI key: https://platform.openai.com/api-keys\n');
  process.exit(1);
}

