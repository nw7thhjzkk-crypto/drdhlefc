"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMember(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const dob = formData.get("dob") as string;
  const gender = formData.get("gender") as string;
  const address = formData.get("address") as string;
  const emergency_contact_name = formData.get("emergency_contact_name") as string;
  const emergency_contact_phone = formData.get("emergency_contact_phone") as string;
  const primary_goal = formData.get("primary_goal") as string;
  const secondary_goal = formData.get("secondary_goal") as string;
  const fitness_level = formData.get("fitness_level") as string;
  const diet_preference = formData.get("diet_preference") as string;
  const training_experience = formData.get("training_experience") as string;
  const notes = formData.get("notes") as string;
  const photo = formData.get("photo") as File;

  let photo_url = null;

  if (photo && photo.size > 0) {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `members/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, photo);

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from('member-photos').getPublicUrl(filePath);
    photo_url = data.publicUrl;
  }

  // 1. Create auth user using Admin API (service role required, normally handled differently but keeping it simple for the action)
  // Note: For a real app, creating auth users from a server action requires the service role key,
  // but `@supabase/ssr` `createServerClient` uses the anon key by default.
  // We'll initialize a service role client just for the admin creation part.
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminAuthClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-8) + 'A1!', // Generate random password
    email_confirm: true,
    user_metadata: { role: 'member', full_name: name }
  });

  if (authError) {
    return { error: authError.message };
  }

  const profile_id = authData.user.id;

  // 2. Insert into members table
  const member_code = `DHL-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .insert({
      profile_id,
      member_code,
      name,
      email,
      phone,
      dob: dob || null,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      primary_goal,
      secondary_goal,
      fitness_level,
      diet_preference,
      training_experience,
      notes,
      photo_url,
      status: 'active'
    })
    .select('id')
    .single();

  if (memberError) {
    return { error: memberError.message };
  }

  // 3. Log to audit_logs
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: sessionData.session.user.id,
      action: 'create_member',
      entity_type: 'member',
      entity_id: memberData.id,
      member_id: memberData.id,
      details: { name, email, member_code }
    });
  }

  revalidatePath("/owner/members");
  return { success: true, memberId: memberData.id };
}

export async function updateMember(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates: Record<string, string | null> = {};
  const allowedKeys = ["name", "email", "phone", "dob", "gender", "address", "emergency_contact_name", "emergency_contact_phone", "primary_goal", "secondary_goal", "fitness_level", "diet_preference", "training_experience", "notes"];
  formData.forEach((value, key) => {
    if (allowedKeys.includes(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });

  const photo = formData.get("photo") as File;
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `members/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, photo);

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from('member-photos').getPublicUrl(filePath);
    updates.photo_url = data.publicUrl;
  }

  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: sessionData.session.user.id,
      action: 'update_member',
      entity_type: 'member',
      entity_id: id,
      member_id: id,
      details: updates
    });
  }

  revalidatePath(`/owner/members/${id}`);
  revalidatePath("/owner/members");
  return { success: true };
}

export async function archiveMember(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('members')
    .update({ status: 'inactive' })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: sessionData.session.user.id,
      action: 'archive_member',
      entity_type: 'member',
      entity_id: id,
      member_id: id,
      details: { status: 'inactive' }
    });
  }

  revalidatePath(`/owner/members/${id}`);
  revalidatePath("/owner/members");
  return { success: true };
}

export async function addAssessment(memberId: string, formData: FormData) {
  const supabase = await createClient();

  const height_cm = parseFloat(formData.get("height_cm") as string);
  const weight_kg = parseFloat(formData.get("weight_kg") as string);
  const body_fat_pct = parseFloat(formData.get("body_fat_pct") as string);
  const notes = formData.get("notes") as string;

  let bmi = null;
  if (height_cm > 0 && weight_kg > 0) {
    const height_m = height_cm / 100;
    bmi = parseFloat((weight_kg / (height_m * height_m)).toFixed(2));
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const recorded_by = sessionData?.session?.user?.id;

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      member_id: memberId,
      recorded_by,
      source: 'manual',
      height_cm,
      weight_kg,
      bmi,
      body_fat_pct,
      notes
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  if (recorded_by) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: recorded_by,
      action: 'add_assessment',
      entity_type: 'assessment',
      entity_id: data.id,
      member_id: memberId,
      details: { height_cm, weight_kg, bmi, body_fat_pct }
    });
  }

  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}
