const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read and parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  // Find all matches and take the last one
  const regex = new RegExp(`^${key}=(.*)$`, 'gm');
  let match;
  let lastVal = null;
  while ((match = regex.exec(envContent)) !== null) {
    lastVal = match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return lastVal;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

console.log('Connecting to:', supabaseUrl);
console.log('Service Key:', serviceKey ? serviceKey.substring(0, 12) + '...' : 'none');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function run() {
  try {
    const { data, error } = await supabase.from('bookings').select('*').limit(1);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! First booking details:', data);
      console.log('Keys in bookings table:', data.length > 0 ? Object.keys(data[0]) : 'No bookings in table yet');
      
      // Let's also check if we can describe the table or if approval_status is already there
      const { data: columns, error: colError } = await supabase
        .from('bookings')
        .select('approval_status')
        .limit(1);
      if (colError) {
        console.log('approval_status column check failed:', colError.message);
      } else {
        console.log('approval_status exists!');
      }
    }
  } catch (e) {
    console.error('Failed to query:', e);
  }
}

run();
