import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createAuthUser(email: string, name: string, role: string) {
  const adminAuthClient = createAdminClient();

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + 'A1!', // Generate random password
    email_confirm: true,
    user_metadata: { role, full_name: name }
  });

  if (authError) {
    return { error: authError.message };
  }

  return { id: authData.user.id };
}
