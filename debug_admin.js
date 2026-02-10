
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhkcvqfdyewsxumuazvx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoa2N2cWZkeWV3c3h1bXVhenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDA4ODIsImV4cCI6MjA4MjUxNjg4Mn0.quNxyYYN7A9Hw2Iy87h9WJqyvgTnIDg_ymDDtJkWplg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAdmin() {
    const email = 'admin@ISTA.Tata.ma';
    const password = 'admin123'; // Changed from 'admin' to meet 6-char requirement

    console.log(`Creating admin account: ${email}...`);

    // Try SignUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Administrator',
                role: 'admin'
            }
        }
    });

    if (signUpError) {
        console.error("SignUp Failed:", signUpError.message);
        if (signUpError.message.includes("already registered")) {
            console.log("-> User exists. You probably need to reset the password.");
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5176', // Use new port
            });
            if (!resetError) console.log("-> Password reset email sent as fallback.");
        }
    } else {
        console.log("SignUp SUCCESS! Admin account created.");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

fixAdmin();
