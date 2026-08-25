import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ownerEmail = process.env.OWNER_EMAIL;
const ownerPassword = process.env.OWNER_PASSWORD;

if (!ownerEmail || !ownerPassword) {
  console.error('Error: OWNER_EMAIL and OWNER_PASSWORD must be set in your environment variables.');
  process.exit(1);
}

async function createOwner() {
  console.log(`Attempting to create owner account for ${ownerEmail}...`);

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        role: 'owner',
        full_name: 'Dr DHL',
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.error('❌ User already exists with this email.');
      } else {
        console.error('❌ Error creating user:', authError.message);
      }
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ Failed to retrieve created user data.');
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created successfully with ID: ${userId}`);

    // Profile is automatically created with correct role by the database trigger.
    console.log(`✅ Profile created successfully. Account is now an owner.`);
    console.log(`🎉 Owner setup complete!`);

  } catch (err: unknown) {
    console.error('❌ Unexpected error during setup:', (err as Error).message);
    process.exit(1);
  }
}

createOwner();