import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read credentials from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
    console.error('❌ Could not find Supabase credentials in .env.local');
    process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('📡 Connecting to Supabase...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('\n🚀 Running migration: Add Subject Configs\n');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migration_add_subject_configs.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    try {
        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ Migration failed:', error);
            console.error('If exec_sql function does not exist, you might need to run this SQL in the Supabase SQL Editor manually.');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

runMigration();
