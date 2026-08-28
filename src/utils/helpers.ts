import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadPhoto(
  supabase: SupabaseClient,
  photo: File | null,
  folder: 'members' | 'trainers'
): Promise<{ url?: string; error?: string }> {
  if (!photo || photo.size === 0) {
    return {};
  }

  const fileExt = photo.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('member-photos')
    .upload(filePath, photo);

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from('member-photos').getPublicUrl(filePath);
  return { url: data.publicUrl };
}

export async function createAuthUser(
  email: string,
  name: string,
  role: 'member' | 'trainer'
): Promise<{ userId?: string; error?: string }> {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminAuthClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + 'A1!',
    email_confirm: true,
    user_metadata: { role, full_name: name }
  });

  if (authError) {
    return { error: authError.message };
  }

  return { userId: authData.user.id };
}
