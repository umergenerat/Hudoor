import { createClient } from '@supabase/supabase-js';

// These will be provided via environment variables in GitHub Actions or locally
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
    console.log('--- Supabase Keep-Alive Ping ---');
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        // Perform a simple query to keep the database active
        // We'll try to select from a common table or just a simple health check
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            // If profiles table doesn't exist or isn't accessible, try a raw query or just log the error
            // The goal is activity, so even a failed attempt usually counts as activity if it hits the API
            console.log('Query attempt on "profiles" table...');
            console.error('Note: Ping error (this is okay if it hits the API):', error.message);
        } else {
            console.log('Successfully pinged Supabase database.');
        }
    } catch (err) {
        console.error('Unexpected error during keep-alive:', err);
        process.exit(1);
    }
}

keepAlive();
