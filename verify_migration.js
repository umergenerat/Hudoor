import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read credentials from .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error('❌ Could not read .env.local:', e.message);
    process.exit(1);
}

const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
    console.error('❌ Could not find Supabase credentials in .env.local');
    process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying subject_configs column...');

    const { data, error } = await supabase
        .from('app_settings')
        .select('subject_configs')
        .limit(1);

    if (error) {
        if (error.code === '42703') {
            console.error('❌ FAILURE: Column subject_configs does not exist.');
        } else {
            console.error('❌ Error fetching subject_configs:', JSON.stringify(error, null, 2));
        }
    } else {
        console.log('✅ Success! Column exists.');

        console.log('Testing write operation...');
        const testConfig = { "Math": 50, "Physics": 40 };

        // 1. Check if row exists
        const { data: existing } = await supabase.from('app_settings').select('id').single();

        let writeError;
        if (existing) {
            const { error: updateError } = await supabase
                .from('app_settings')
                .update({ subject_configs: testConfig })
                .eq('id', existing.id);
            writeError = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('app_settings')
                .insert([{ subject_configs: testConfig }]);
            writeError = insertError;
        }

        if (writeError) {
            console.error('❌ Write failed:', JSON.stringify(writeError, null, 2));
        } else {
            console.log('✅ Write successful.');

            // 2. Read back
            const { data: readData, error: readError } = await supabase
                .from('app_settings')
                .select('subject_configs')
                .single();

            if (readError) {
                console.error('❌ Read failed:', JSON.stringify(readError, null, 2));
            } else {
                console.log('Read data:', readData);
                if (JSON.stringify(readData.subject_configs) === JSON.stringify(testConfig)) {
                    console.log('✅ VERIFICATION PASSED: Data persisted correctly.');
                } else {
                    console.error('❌ VERIFICATION FAILED: Data mismatch.');
                }
            }
        }
    }
}

verify();
